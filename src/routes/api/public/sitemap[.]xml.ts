import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getPostUrl } from "@/lib/postUrl";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlTag(loc: string, lastmod?: string, changefreq?: string, priority?: string) {
  return `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${
    changefreq ? `<changefreq>${changefreq}</changefreq>` : ""
  }${priority ? `<priority>${priority}</priority>` : ""}</url>`;
}

// Google's limit is 50,000 URLs per sitemap file. We stay well under that
// while still covering the site's full archive of published posts.
const MAX_POSTS = 45000;

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const origin = new URL(request.url).origin;
        const today = new Date().toISOString();

        const [{ data: categories }, { data: posts }] = await Promise.all([
          db.from("categories").select("slug,updated_at").order("sort_order", { ascending: true }),
          db
            .from("posts")
            .select("slug,published_at,updated_at")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(MAX_POSTS),
        ]);

        const staticUrls = [
          urlTag(`${origin}/`, today, "hourly", "1.0"),
          urlTag(`${origin}/most-read`, today, "hourly", "0.7"),
          urlTag(`${origin}/search`, today, "weekly", "0.3"),
          urlTag(`${origin}/about`, today, "monthly", "0.3"),
          urlTag(`${origin}/rss`, today, "daily", "0.3"),
        ].join("");

        const categoryUrls = (categories ?? [])
          .map((c) =>
            urlTag(`${origin}/category/${c.slug}`, c.updated_at ?? today, "hourly", "0.8"),
          )
          .join("");

        const postUrls = (posts ?? [])
          .map((post) => {
            const link = `${origin}${getPostUrl(post)}`;
            const lastmod = new Date(post.updated_at ?? post.published_at).toISOString();
            return urlTag(link, lastmod, "daily", "0.6");
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${categoryUrls}${postUrls}</urlset>`;

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
