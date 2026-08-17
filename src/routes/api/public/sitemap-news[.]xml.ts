import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPostUrl } from "@/lib/postUrl";

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_NEWS_POSTS = 1000;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/api/public/sitemap-news.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const cutoff = new Date(Date.now() - NEWS_WINDOW_MS).toISOString();
        const { data, error } = await db
          .from("posts")
          .select("id,title,slug,published_at")
          .eq("status", "published")
          .gte("published_at", cutoff)
          .order("published_at", { ascending: false })
          .limit(MAX_NEWS_POSTS);

        if (error) {
          console.error("News sitemap query failed:", error.message);
          return new Response("Internal Server Error", { status: 500 });
        }

        const origin = new URL(request.url).origin;
        const urls = (data ?? [])
          .map((post) => {
            const loc = `${origin}${getPostUrl(post)}`;
            return `<url><loc>${escapeXml(loc)}</loc><news:news><news:publication><news:name>شمسان نيوز</news:name><news:language>ar</news:language></news:publication><news:publication_date>${new Date(post.published_at).toISOString()}</news:publication_date><news:title>${escapeXml(post.title)}</news:title></news:news></url>`;
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
