/**
 * وظائف مساعدة لإنشاء وتحليل روابط المقالات المبنية على التاريخ.
 * الصيغة المعتمدة: /YYYY/MM/DD/slug بدون مائلة نهائية.
 * تاريخ الرابط القانوني هو وقت النشر الفعلي published_at بتوقيت اليمن UTC+3.
 */

const YEMEN_OFFSET_MS = 3 * 60 * 60 * 1000;

export type CanonicalPost = {
  id: string;
  published_at?: string | null;
  created_at?: string | null;
  slug?: string | null;
  title?: string;
};

// توليد الـ Slug من العنوان مع دعم العربية والإنجليزية.
export function generateSlug(title: string): string {
  let result = title.replace(/[^\u0600-\u06FF\w\s-]/g, "");
  result = result.replace(/\s+/g, "-");
  result = result.replace(/-+/g, "-");
  result = result.replace(/^-+|-+$/g, "");
  return result.substring(0, 100);
}

/** يعيد وقت النشر القانوني، مع توافق آمن مع سجلات تاريخية قديمة. */
export function getCanonicalTimestamp(post: CanonicalPost): string {
  return post.published_at || post.created_at || new Date().toISOString();
}

/** يحول الطابع الزمني إلى أجزاء تاريخ اليمن الثابت UTC+3، بلا اعتماد على منطقة خادم الاستضافة. */
export function getYemenDateParts(timestamp: string): { year: number; month: string; day: string } {
  const date = new Date(timestamp);
  const shifted = new Date(date.getTime() + YEMEN_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    day: String(shifted.getUTCDate()).padStart(2, "0"),
  };
}

/** ينشئ المسار القانوني للمقال من وقت النشر الفعلي وslug المخزن. */
export function getPostUrl(post: CanonicalPost): string {
  const { year, month, day } = getYemenDateParts(getCanonicalTimestamp(post));
  const slug = post.slug || (post.title ? generateSlug(post.title) : post.id);
  return `/${year}/${month}/${day}/${encodeURIComponent(slug)}`;
}

export function parseDateUrl(
  year: string,
  month: string,
  day: string,
  slug: string,
): { year: number; month: number; day: number; slug: string } | null {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { year: y, month: m, day: d, slug: decodeURIComponent(slug) };
}

export function isDatePath(segment: string): boolean {
  const num = parseInt(segment, 10);
  return !isNaN(num) && num >= 2024 && num <= 2100;
}
