import { createFileRoute, Link } from "@tanstack/react-router";
import { getFeedPosts } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { SectionHeading } from "@/components/site/SectionHeading";
import { articlePath, formatArabicDate, type PostSummary } from "@/lib/news.types";

export const Route = createFileRoute("/rss")({
  loader: () => getFeedPosts(),
  head: () => ({
    meta: [
      { title: "موجز RSS | شمسان نيوز" },
      { name: "description", content: "موجز آخر أخبار شمسان نيوز، متاح أيضًا بصيغة XML للقارئات." },
      { property: "og:title", content: "موجز RSS | شمسان نيوز" },
      { property: "og:description", content: "اشترك في موجز شمسان نيوز لمتابعة آخر الأخبار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RssPage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تحميل الموجز.</p>
    </SiteShell>
  ),
});

function RssPage() {
  const posts = Route.useLoaderData() as unknown as PostSummary[];
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SectionHeading title="موجز RSS" />
        <p className="mb-6 text-sm leading-7 text-muted-foreground">
          يمكنك متابعة آخر أخبارنا عبر رابط الموجز:{" "}
          <a href="/api/public/rss.xml" className="font-bold text-accent underline">
            /api/public/rss.xml
          </a>
        </p>
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id} className="py-3">
              <Link
                to="/$year/$month/$day/$slug"
                params={articlePath(post)}
                className="font-semibold hover:text-accent"
              >
                {post.title}
              </Link>
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatArabicDate(post.published_at)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  );
}
