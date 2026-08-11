import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { getCategoryData } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsCard } from "@/components/site/NewsCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { MostRead } from "@/components/site/MostRead";
import { AdSlot } from "@/components/site/AdSlot";
import { CategoryPagination } from "@/components/site/CategoryPagination";
import type { CategoryRow, PostSummary } from "@/lib/news.types";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: z.object({ page: z.number().int().min(1).catch(1) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps }) => {
    const data = await getCategoryData({ data: { slug: params.slug, page: deps.page } });
    if (!data.category) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.category) {
      return { meta: [{ title: "القسم غير متوفر | شمسان نيوز" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category.name} | شمسان نيوز`;
    const description =
      loaderData.category.description ?? `كل أخبار وتقارير قسم ${loaderData.category.name} على شمسان نيوز.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">هذا القسم غير موجود.</p>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تحميل القسم، حاول التحديث.</p>
    </SiteShell>
  ),
});

function CategoryPage() {
  const { category, posts, children, page, totalPages } = Route.useLoaderData();
  const subs = children as unknown as CategoryRow[];
  const items = posts as unknown as PostSummary[];

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <SectionHeading title={category!.name} />
            {category!.description ? (
              <p className="mb-6 text-sm leading-7 text-muted-foreground">{category!.description}</p>
            ) : null}
            {subs.length ? (
              <p className="mb-6 text-sm text-muted-foreground">
                أقسام فرعية: {subs.map((c) => c.name).join(" • ")}
              </p>
            ) : null}
            {items.length ? (
              <>
                <div className="space-y-6">
                  {items.map((post) => (
                    <NewsCard key={post.id} post={post} variant="wide" />
                  ))}
                </div>
                <CategoryPagination slug={category!.slug} page={page} totalPages={totalPages} />
              </>
            ) : (
              <p className="py-12 text-center text-muted-foreground">لا توجد أخبار في هذا القسم بعد.</p>
            )}
          </div>
          <aside className="space-y-6">
            <MostRead posts={items} />
            <AdSlot placement="category-sidebar" className="h-64" />
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
