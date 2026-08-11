// روابط وصور افتراضية ثابتة تُستخدم كـ fallback عند غياب cover_image بالخبر.
// نفس منطق الجنوب فويس حرفياً — موحّدة بملف واحد ليُستخدم بكل الواجهات
// (تفاصيل الخبر، الأقسام، الرئيسية، لوحة تحكم الأدمن) بدل تكرار المنطق.

// ⚠️ عدّل هذا إلى نطاق موقع شمسان نيوز الفعلي عند ربط الدومين
export const SITE_URL = "https://shamsan-news.com";

// خريطة: اسم القسم (name بجدول categories) ← صورته الافتراضية عند نشر خبر
// بدون صورة. فارغة حالياً — أضف أي قسم له صورة افتراضية هنا، مثال:
// const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
//   "أسعار العملات والذهب": `${SITE_URL}/currency-gold-default.webp`,
// };
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {};

type PostLike = {
  image_url?: string | null;
  cover_image?: string | null;
  thumbnail_image?: string | null;
  category?: string | null;
};

function resolveImage(post: PostLike): string | null | undefined {
  return post.cover_image ?? post.image_url;
}

/**
 * يُرجع رابط صورة الخبر المناسب للعرض:
 * 1) صورة الخبر الخاصة (cover_image) إن وُجدت.
 * 2) الصورة الافتراضية لقسمه إن كان له صورة افتراضية معرّفة بالخريطة أعلاه
 *    (مرّر اسم القسم النصي، وليس معرّف category_id).
 * 3) undefined إن لم يتوفر أي منهما.
 */
export function getPostImage(post: PostLike): string | undefined {
  const img = resolveImage(post);
  if (img) return img;
  if (post.category && CATEGORY_DEFAULT_IMAGES[post.category]) {
    return CATEGORY_DEFAULT_IMAGES[post.category];
  }
  return undefined;
}

/**
 * نفس getPostImage، لكن تُفضّل النسخة المصغّرة (thumbnail_image) إن وُجدت.
 */
export function getPostThumbnail(post: PostLike): string | undefined {
  if (post.thumbnail_image) return post.thumbnail_image;
  return getPostImage(post);
}

/**
 * نفس getPostImage، لكن تُرجع شعار الموقع كحل أخير بدل undefined —
 * لاستخدامات og:image / twitter:image / JSON-LD.
 */
export function getPostImageOrLogo(post: PostLike): string {
  return getPostImage(post) || `${SITE_URL}/logo.png`;
}

/** هل لهذا القسم صورة افتراضية معرّفة؟ (تُستخدم لإظهار معاينة بنموذج الأدمن) — مرّر اسم القسم النصي */
export function hasCategoryDefaultImage(category?: string | null): boolean {
  return !!category && !!CATEGORY_DEFAULT_IMAGES[category];
}

/** يُرجع الصورة الافتراضية لقسم معيّن (بالاسم)، أو undefined إن لم تكن له صورة افتراضية */
export function getCategoryDefaultImage(category?: string | null): string | undefined {
  return category ? CATEGORY_DEFAULT_IMAGES[category] : undefined;
}
