import { createFileRoute } from "@tanstack/react-router";
import { getMostReadPosts } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsCard } from "@/components/site/NewsCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import type { PostSummary } from "@/lib/news.types";

export const Route = createFileRoute("/most-read")({
  loader: () => getMostReadPosts(),
  head: () => ({
    meta: [
      { title: "الأكثر قراءة | شمسان نيوز" },
      { name: "description", content: "أكثر الأخبار والتقارير قراءة على منصة شمسان نيوز." },
      { property: "og:title", content: "الأكثر قراءة | شمسان نيوز" },
      { property: "og:description", content: "قائمة الأخبار الأكثر قراءة على شمسان نيوز." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MostReadPage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تحميل القائمة.</p>
    </SiteShell>
  ),
});

function MostReadPage() {
  const posts = Route.useLoaderData() as unknown as PostSummary[];
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <SectionHeading title="الأكثر قراءة" />
        <ol className="space-y-6">
          {posts.map((post, i) => (
            <li key={post.id} className="flex gap-4">
              <span className="font-display text-2xl font-black text-accent/60">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <NewsCard post={post} variant="wide" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SiteShell>
  );
}
