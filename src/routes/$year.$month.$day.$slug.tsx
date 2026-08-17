import { useRef, useEffect } from "react";
import { createFileRoute, notFound, redirect, Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { getPostBySlug } from "@/lib/news.functions";
import { SiteShell } from "@/components/site/SiteShell";
import { NewsCard } from "@/components/site/NewsCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { MostRead } from "@/components/site/MostRead";
import { AdSlot } from "@/components/site/AdSlot";
import { ShareButtons } from "@/components/site/ShareButtons";
import { formatArabicDateTime, type PostFull, type PostSummary } from "@/lib/news.types";
import { getPostUrl } from "@/lib/postUrl";
import { SEO_SITE_URL } from "@/lib/seoHelpers";

export const Route = createFileRoute("/$year/$month/$day/$slug")({
  loader: async ({ params }) => {
    const data = await getPostBySlug({ data: { slug: params.slug } });
    if (!data.post) throw notFound();

    const canonicalPath = getPostUrl(data.post);
    const requestedPath = `/${params.year}/${params.month}/${params.day}/${encodeURIComponent(params.slug)}`;
    if (requestedPath !== canonicalPath) {
      throw redirect({ href: canonicalPath, statusCode: 301 });
    }

    return data;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post as PostFull | undefined;
    if (!post) {
      return { meta: [{ title: "الخبر غير متوفر | شمسان نيوز" }, { name: "robots", content: "noindex" }] };
    }
    const title = post.seo_title ?? `${post.title} | شمسان نيوز`;
    const description = post.seo_description ?? post.excerpt ?? "تقرير من شمسان نيوز.";
    const canonicalUrl = `${SEO_SITE_URL}${getPostUrl(post)}`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: canonicalUrl },
      { property: "article:published_time", content: post.published_at },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (post.cover_image?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: post.cover_image },
        { name: "twitter:image", content: post.cover_image },
      );
    }
    return { meta, links: [{ rel: "canonical", href: canonicalUrl }] };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">هذا الخبر غير متوفر أو تم حذفه.</p>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-muted-foreground">تعذر تحميل الخبر، حاول التحديث.</p>
    </SiteShell>
  ),
});

function ArticlePage() {
  const { post, related } = Route.useLoaderData();
  const article = post as unknown as PostFull;
  const others = related as unknown as PostSummary[];
  const bodyRef = useRef<HTMLDivElement>(null);
  const canonicalUrl = `${SEO_SITE_URL}${getPostUrl(article)}`;
  const newsArticleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: article.title,
    description: article.seo_description || article.excerpt || article.title,
    image: article.cover_image ? [article.cover_image] : undefined,
    datePublished: article.published_at,
    dateModified: article.published_at,
    author: { "@type": "Person", name: article.author?.name || "شمسان نيوز" },
    publisher: {
      "@type": "Organization",
      name: "شمسان نيوز",
      url: SEO_SITE_URL,
      logo: { "@type": "ImageObject", url: `${SEO_SITE_URL}/logo.png` },
    },
    inLanguage: "ar",
  }).replace(/</g, "\\u003c");

  // إضافة اسم الموقع ورابط الخبر تلقائياً عند نسخ نص من داخل المقال
  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    function handleCopy(e: ClipboardEvent) {
      const selection = window.getSelection()?.toString();
      if (!selection) return;
      let readableUrl = window.location.href;
      try {
        readableUrl = decodeURI(window.location.href);
      } catch {
        // إبقاء الرابط كما هو إذا تعذّر فك ترميزه
      }
      const attribution = `\n\nالمصدر: شمسان نيوز - ${readableUrl}`;
      e.clipboardData?.setData("text/plain", `${selection}${attribution}`);
      e.preventDefault();
    }
    node.addEventListener("copy", handleCopy);
    return () => node.removeEventListener("copy", handleCopy);
  }, []);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: newsArticleSchema }} />
            <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-accent">
                الرئيسية
              </Link>
              {article.category ? (
                <>
                  <span>/</span>
                  <Link
                    to="/category/$slug"
                    params={{ slug: article.category.slug }}
                    className="font-semibold text-accent"
                  >
                    {article.category.name}
                  </Link>
                </>
              ) : null}
            </nav>

            <h1 className="text-2xl font-black leading-10 sm:text-3xl sm:leading-[3rem]">
              {article.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground">
              {article.author?.name ? (
                <span className="font-bold text-foreground">{article.author.name}</span>
              ) : null}
              <span>{formatArabicDateTime(article.published_at)}</span>
              {/* إخفاء مؤقت لعدد المشاهدات - لإعادة الإظهار احذفي التعليق عن الكتلة التالية
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {article.views.toLocaleString("ar")} مشاهدة
              </span>
              */}
            </div>

            {article.cover_image ? (
              <img
                src={article.cover_image}
                alt={article.title}
                className="mt-6 aspect-[16/9] w-full rounded object-cover"
              />
            ) : null}

            {article.excerpt ? (
              <p className="mt-6 border-s-4 border-accent ps-4 text-base font-semibold leading-8">
                {article.excerpt}
              </p>
            ) : null}

            <div
              ref={bodyRef}
              className="article-body mt-6"
              dangerouslySetInnerHTML={{ __html: article.content ?? "" }}
            />

            <div className="mt-8 border-y border-border py-5">
              <ShareButtons title={article.title} postId={article.id} />
            </div>

            <AdSlot placement="article-bottom" className="mt-10 h-24" />

            {others.length ? (
              <section className="mt-12">
                <SectionHeading title="أخبار ذات صلة" />
                <div className="grid gap-6 sm:grid-cols-3">
                  {others.slice(0, 3).map((item) => (
                    <NewsCard key={item.id} post={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="space-y-6">
            <MostRead posts={others} />
            <AdSlot placement="article-sidebar" className="h-64" />
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
