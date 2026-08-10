import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { searchPosts } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsCard } from "@/components/site/NewsCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import type { PostSummary } from "@/lib/news.types";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().catch("") }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => (deps.q ? await searchPosts({ data: { q: deps.q } }) : []),
  head: () => ({
    meta: [
      { title: "البحث | شمسان نيوز" },
      { name: "description", content: "ابحث في أرشيف أخبار وتقارير شمسان نيوز." },
      { property: "og:title", content: "البحث | شمسان نيوز" },
      { property: "og:description", content: "نتائج البحث في أرشيف شمسان نيوز." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تنفيذ البحث.</p>
    </SiteShell>
  ),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const posts = Route.useLoaderData() as unknown as PostSummary[];

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <SectionHeading title={q ? `نتائج البحث عن: ${q}` : "البحث"} />
        {posts.length ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <NewsCard key={post.id} post={post} variant="wide" />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">لا توجد نتائج مطابقة.</p>
        )}
      </div>
    </SiteShell>
  );
}
