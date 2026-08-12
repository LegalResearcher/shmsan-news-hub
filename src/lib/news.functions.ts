import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, POST_FIELDS } from "./news.server";

// الأقسام التي تُعرض أخبارها ضمن قائمة "أحدث الأخبار" بالرئيسية
const LATEST_NEWS_CATEGORY_NAMES = ["أخبار وتقارير", "شؤون دولية", "أخبار اليمن"];

// ترتيب أقسام الرئيسية بعد "أحدث الأخبار" (نفس القائمة المستخدمة بصفحة الرئيسية)
// "آراء واتجاهات" و"رياضة" مخفيان مؤقتاً (احذف التعليق // لإعادتهما)
const HOME_SECTION_NAMES = [
  "أخبار وتقارير",
  "أخبار اليمن",
  "شؤون دولية",
  "منوعات",
  // "آراء واتجاهات",
  // "رياضة",
];

// عدد الأخبار المعروضة لكل قسم بالرئيسية
const HOME_SECTION_POST_LIMIT = 4;

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();

  const { data: categories } = await db
    .from("categories")
    .select("id,name,slug,description,sort_order,parent_id")
    .order("sort_order");

  const latestNewsCategoryIds = (categories ?? [])
    .filter((c) => LATEST_NEWS_CATEGORY_NAMES.includes(c.name))
    .map((c) => c.id);

  // أقسام الرئيسية: كل قسم يجيب أحدث أخباره الخاصة مباشرة (بدل الفلترة على قائمة عامة محدودة)
  const homeSectionCategories = (categories ?? []).filter((c) => HOME_SECTION_NAMES.includes(c.name));

  const [posts, breaking, ads, latestNews, marketRates, sectionResults] = await Promise.all([
    db
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60),
    db.from("breaking_news").select("id,text,link").eq("is_active", true).order("sort_order"),
    db.from("ads").select("id,name,placement,image_url,link_url").eq("is_active", true),
    latestNewsCategoryIds.length
      ? db
          .from("posts")
          .select(POST_FIELDS)
          .eq("status", "published")
          .in("category_id", latestNewsCategoryIds)
          .order("published_at", { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] as unknown[] }),
    db
      .from("market_rates")
      .select("city,kind,code,label,buy,sell,prev_sell,updated_at")
      .order("kind")
      .order("code"),
    Promise.all(
      homeSectionCategories.map((cat) =>
        db
          .from("posts")
          .select(POST_FIELDS)
          .eq("status", "published")
          .eq("category_id", cat.id)
          .order("published_at", { ascending: false })
          .limit(HOME_SECTION_POST_LIMIT),
      ),
    ),
  ]);
  const mostRead = await db
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(8);

  // نبني خريطة { categoryId: [أحدث أخباره] } تُستخدم بالرئيسية بدل الفلترة اليدوية
  const sectionPostsByCategoryId: Record<string, unknown[]> = {};
  homeSectionCategories.forEach((cat, idx) => {
    sectionPostsByCategoryId[cat.id] = sectionResults[idx]?.data ?? [];
  });

  return {
    posts: posts.data ?? [],
    categories: categories ?? [],
    breaking: breaking.data ?? [],
    ads: ads.data ?? [],
    mostRead: mostRead.data ?? [],
    latestNews: latestNews.data ?? [],
    marketRates: marketRates.data ?? [],
    sectionPostsByCategoryId,
  };
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: post } = await db
      .from("posts")
      .select(`${POST_FIELDS},content,seo_title,seo_description`)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return { post: null, related: [] };
    const { data: related } = await db
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .neq("slug", data.slug)
      .order("published_at", { ascending: false })
      .limit(6);
    await db.rpc("increment_post_views", { _slug: data.slug });
    return { post, related: related ?? [] };
  });

// عدد الأخبار في كل صفحة من صفحات القسم
export const CATEGORY_PAGE_SIZE = 10;

export const getCategoryData = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ slug: z.string().min(1), page: z.number().int().min(1).catch(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: category } = await db
      .from("categories")
      .select("id,name,slug,description,sort_order,parent_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!category) return { category: null, posts: [], children: [], page: 1, totalPages: 1, total: 0 };
    const { data: children } = await db
      .from("categories")
      .select("id,name,slug,description,sort_order,parent_id")
      .eq("parent_id", category.id);
    const ids = [category.id, ...(children ?? []).map((c) => c.id)];
    const page = data.page;
    const from = (page - 1) * CATEGORY_PAGE_SIZE;
    const to = from + CATEGORY_PAGE_SIZE - 1;
    const { data: posts, count } = await db
      .from("posts")
      .select(POST_FIELDS, { count: "exact" })
      .eq("status", "published")
      .in("category_id", ids)
      .order("published_at", { ascending: false })
      .range(from, to);
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
    return { category, posts: posts ?? [], children: children ?? [], page, totalPages, total };
  });

export const getMarketRates = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db
    .from("market_rates")
    .select("city,kind,code,label,buy,sell,prev_sell,updated_at")
    .order("kind")
    .order("code");
  return data ?? [];
});

export const getNavigation = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db
    .from("categories")
    .select("id,name,slug,description,sort_order,parent_id")
    .order("sort_order");
  const { data: breaking } = await db
    .from("breaking_news")
    .select("id,text,link")
    .eq("is_active", true)
    .order("sort_order");
  return { categories: data ?? [], breaking: breaking ?? [] };
});

export const getMostReadPosts = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(30);
  return data ?? [];
});

export const getFeedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);
  return data ?? [];
});

export const searchPosts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: posts } = await db
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .or(`title.ilike.%${data.q}%,excerpt.ilike.%${data.q}%`)
      .order("published_at", { ascending: false })
      .limit(30);
    return posts ?? [];
  });
