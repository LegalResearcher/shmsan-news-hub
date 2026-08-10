export interface PostRef {
  name: string;
  slug: string;
  avatar_url?: string | null;
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string;
  views: number;
  is_featured: boolean;
  is_opinion: boolean;
  category: PostRef | null;
  author: PostRef | null;
}

export interface PostFull extends PostSummary {
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  parent_id: string | null;
}

export interface BreakingItem {
  id: string;
  text: string;
  link: string | null;
}

export interface AdRow {
  id: string;
  name: string;
  placement: string;
  image_url: string | null;
  link_url: string | null;
}

export function articlePath(post: { slug: string; published_at: string }) {
  const d = new Date(post.published_at);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
    slug: post.slug,
  };
}

export function formatArabicDate(value: string) {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatArabicDateTime(value: string) {
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}