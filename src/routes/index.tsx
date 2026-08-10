import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getHomeData } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { HeroSlider } from "@/components/site/HeroSlider";
import { NewsCard } from "@/components/site/NewsCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { MostRead } from "@/components/site/MostRead";
import { MarketWidget } from "@/components/site/MarketWidget";
import { AdSlot } from "@/components/site/AdSlot";
import { Link } from "@tanstack/react-router";
import { articlePath, type CategoryRow, type PostSummary } from "@/lib/news.types";

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: "شمسان نيوز | آخر الأخبار والتحليلات" },
      {
        name: "description",
        content:
          "بوابة شمسان نيوز الإخبارية: أهم الأخبار المحلية والدولية، شمسان اليوم، مقالات وآراء، تاريخ وتراث، وتحليلات تحت المجهر.",
      },
      { property: "og:title", content: "شمسان نيوز | آخر الأخبار والتحليلات" },
      {
        property: "og:description",
        content: "تابع آخر الأخبار والتقارير والتحليلات على مدار الساعة من شمسان نيوز.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تحميل الأخبار، حاول التحديث.</p>
    </SiteShell>
  ),
});

// ترتيب أقسام الرئيسية بعد "أحدث الأخبار"
const HOME_SECTION_ORDER = ["أخبار وتقارير", "شؤون دولية", "آراء واتجاهات", "منوعات", "رياضة"];

function LatestNewsList({ posts }: { posts: PostSummary[] }) {
  const [page, setPage] = useState(0);
  const perPage = 30;
  const items = posts.slice(0, perPage * 2); // أحدث 60 خبر مقسّمة على صفحتين (30 لكل صفحة)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pageItems = items.slice(page * perPage, page * perPage + perPage);

  return (
    <section>
      <SectionHeading title="أحدث الأخبار" />
      <ul className="space-y-3">
        {pageItems.map((post) => (
          <li key={post.id}>
            <Link
              to="/$year/$month/$day/$slug"
              params={articlePath(post)}
              className="block rounded border border-border bg-surface px-4 py-3 font-bold leading-7 transition-colors hover:border-accent hover:text-accent"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="rounded border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            التالي
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page <= 0}
            className="rounded border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            السابق
          </button>
        </div>
      ) : null}
    </section>
  );
}

function HomePage() {
  const loaderData = Route.useLoaderData();
  const { posts, breaking, ads, mostRead } = loaderData;
  const categories = loaderData.categories as unknown as CategoryRow[];
  const all = posts as unknown as PostSummary[];
  const featured = all.filter((p) => p.is_featured).slice(0, 5);
  const hero = featured.length ? featured : all.slice(0, 5);
  const mainCategories = categories
    .filter((c) => !c.parent_id && HOME_SECTION_ORDER.includes(c.name))
    .sort((a, b) => HOME_SECTION_ORDER.indexOf(a.name) - HOME_SECTION_ORDER.indexOf(b.name));

  return (
    <SiteShell categories={categories} breaking={breaking}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-10">
            <HeroSlider posts={hero} />

            <LatestNewsList posts={all} />

            <AdSlot placement="home-inline" ads={ads} className="h-24" />

            {mainCategories.map((cat) => {
              const items = all
                .filter((p) => p.category?.slug === cat.slug)
                .slice(0, 4);
              if (!items.length) return null;
              return (
                <section key={cat.id}>
                  <SectionHeading title={cat.name} slug={cat.slug} />
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((post) => (
                      <NewsCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <MostRead posts={mostRead as unknown as PostSummary[]} />
            <MarketWidget />
            <AdSlot placement="sidebar" ads={ads} className="h-64" />
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
