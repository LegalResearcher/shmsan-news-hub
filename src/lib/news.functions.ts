import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient, POST_FIELDS } from "./news.server";

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const [posts, categories, breaking, ads] = await Promise.all([
    db
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60),
    db.from("categories").select("id,name,slug,description,sort_order,parent_id").order("sort_order"),
    db.from("breaking_news").select("id,text,link").eq("is_active", true).order("sort_order"),
    db.from("ads").select("id,name,placement,image_url,link_url").eq("is_active", true),
  ]);
  const mostRead = await db
    .from("posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(8);
  return {
    posts: posts.data ?? [],
    categories: categories.data ?? [],
    breaking: breaking.data ?? [],
    ads: ads.data ?? [],
    mostRead: mostRead.data ?? [],
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

export const getCategoryData = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: category } = await db
      .from("categories")
      .select("id,name,slug,description,sort_order,parent_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!category) return { category: null, posts: [], children: [] };
    const { data: children } = await db
      .from("categories")
      .select("id,name,slug,description,sort_order,parent_id")
      .eq("parent_id", category.id);
    const ids = [category.id, ...(children ?? []).map((c) => c.id)];
    const { data: posts } = await db
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .in("category_id", ids)
      .order("published_at", { ascending: false })
      .limit(40);
    return { category, posts: posts ?? [], children: children ?? [] };
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