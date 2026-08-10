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
import { articlePath, formatArabicDate, type CategoryRow, type PostSummary } from "@/lib/news.types";

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

function HomePage() {
  const loaderData = Route.useLoaderData();
  const { posts, breaking, ads, mostRead } = loaderData;
  const categories = loaderData.categories as unknown as CategoryRow[];
  const all = posts as unknown as PostSummary[];
  const featured = all.filter((p) => p.is_featured).slice(0, 5);
  const hero = featured.length ? featured : all.slice(0, 5);
  const opinions = all.filter((p) => p.is_opinion).slice(0, 4);
  const mainCategories = categories.filter((c) => !c.parent_id);

  const heroIds = new Set(hero.map((p) => p.id));
  const latest = all.filter((p) => !heroIds.has(p.id)).slice(0, 4);

  return (
    <SiteShell categories={categories} breaking={breaking}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-10">
            <HeroSlider posts={hero} />

            <section>
              <SectionHeading title="أحدث الأخبار" />
              <div className="grid gap-6 sm:grid-cols-2">
                {latest.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            </section>

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

            {opinions.length ? (
              <section>
                <SectionHeading title="مقالات وآراء" slug="opinion" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {opinions.map((post) => (
                    <Link
                      key={post.id}
                      to="/$year/$month/$day/$slug"
                      params={articlePath(post)}
                      className="group flex gap-4 rounded border border-border bg-card p-4"
                    >
                      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface font-display font-bold text-muted-foreground">
                        {post.author?.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (post.author?.name ?? "ش").slice(0, 1)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-accent">
                          {post.author?.name ?? "هيئة التحرير"}
                        </span>
                        <span className="mt-1 block font-bold leading-7 transition-colors group-hover:text-accent">
                          {post.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatArabicDate(post.published_at)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
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
