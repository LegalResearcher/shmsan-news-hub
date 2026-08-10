import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/api/public/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const db = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const { data } = await db
          .from("posts")
          .select("title,slug,excerpt,published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(30);

        const origin = new URL(request.url).origin;
        const items = (data ?? [])
          .map((post) => {
            const d = new Date(post.published_at);
            const link = `${origin}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
              d.getDate(),
            ).padStart(2, "0")}/${post.slug}`;
            return `<item><title>${escapeXml(post.title)}</title><link>${link}</link><guid>${link}</guid><description>${escapeXml(
              post.excerpt ?? "",
            )}</description><pubDate>${d.toUTCString()}</pubDate></item>`;
          })
          .join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>شمسان نيوز</title><link>${origin}</link><description>آخر أخبار شمسان نيوز</description><language>ar</language>${items}</channel></rss>`;

        return new Response(xml, {
          headers: { "content-type": "application/rss+xml; charset=utf-8" },
        });
      },
    },
  },
});
