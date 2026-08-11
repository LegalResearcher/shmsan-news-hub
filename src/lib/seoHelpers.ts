// Advanced SEO Helpers for Google Indexing Optimization — نفس منطق الجنوب فويس حرفياً
import { getPostImageOrLogo } from "./defaultImages";

// ⚠️ عدّل هذا إلى نطاق موقع شمسان نيوز الفعلي عند ربط الدومين
export const SEO_SITE_URL = "https://shamsan-news.com";
export const SEO_SITE_NAME = "شمسان نيوز";

// الكلمات المفتاحية العربية التي يتم حذفها من الروابط لتحسين الـ SEO
const ARABIC_STOP_WORDS = [
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'أن', 'كان',
  'بين', 'ما', 'لم', 'قد', 'بعد', 'قبل', 'أو', 'و', 'ال', 'إن', 'لا', 'إذا', 'كل',
  'ذلك', 'أي', 'هو', 'هي', 'نحن', 'هم', 'أنت', 'كما', 'حيث', 'لكن', 'حتى', 'عند',
  'خلال', 'منذ', 'ضد', 'بعض', 'أما', 'لأن', 'ثم', 'التى', 'الذى', 'اذا', 'انه',
  'انها', 'كذلك', 'وقد', 'وفي', 'ومن', 'وعلى', 'وإلى', 'ولم', 'وقال', 'وكان'
];

// الكيانات المستخدمة للاستخراج التلقائي للوسوم — عدّلها حسب نطاق تغطية شمسان نيوز
const SEO_ENTITIES = [
  'عدن', 'حضرموت', 'المكلا', 'شبوة', 'أبين', 'لحج', 'الضالع', 'سقطرى', 'المهرة',
  'تعز', 'مأرب', 'صنعاء', 'الحديدة', 'باب المندب', 'الساحل الغربي', 'الجنوب',
  'اليمن', 'السعودية', 'الرياض', 'الإمارات', 'أبوظبي', 'سلطنة عمان', 'مسقط',
  'مجلس التعاون الخليجي', 'الأمم المتحدة', 'المجلس الانتقالي الجنوبي'
];

/**
 * توليد عنوان ميتا محسن (بحد أقصى 70 حرفاً)
 */
export function generateMetaTitle(title: string): string {
  const brand = ` | ${SEO_SITE_NAME}`;
  const maxLength = 70 - brand.length;

  let trimmedTitle = title.trim();

  if (trimmedTitle.length <= maxLength) {
    return trimmedTitle + brand;
  }

  trimmedTitle = trimmedTitle.substring(0, maxLength);
  const lastSpaceIndex = trimmedTitle.lastIndexOf(' ');

  if (lastSpaceIndex > 0) {
    trimmedTitle = trimmedTitle.substring(0, lastSpaceIndex);
  }

  return trimmedTitle + brand;
}

/**
 * توليد رابط (Slug) محسن: حذف كلمات الربط + تقليل الطول لـ 85 حرفاً
 */
export function generateSEOSlug(title: string): string {
  let slug = title.trim();

  // حذف كلمات الربط العربية لجعل الرابط قصيراً ومركّزاً
  ARABIC_STOP_WORDS.forEach(word => {
    const regex = new RegExp(`(^|\\s)${word}(\\s|$)`, 'g');
    slug = slug.replace(regex, ' ');
  });

  slug = slug
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length > 85) {
    slug = slug.substring(0, 85);
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex > 0) {
      slug = slug.substring(0, lastHyphenIndex);
    }
  }

  return slug;
}

/**
 * استخراج الكلمات المفتاحية تلقائياً من المحتوى
 */
export function extractSEOKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const keywords: string[] = [];

  SEO_ENTITIES.forEach(entity => {
    if (text.includes(entity.toLowerCase()) || text.includes(entity)) {
      keywords.push(entity);
    }
  });

  return [...new Set(keywords)];
}

/**
 * توليد Schema المادة الإخبارية (JSON-LD)
 * تدعم ظهور الخبر في "أهم القصص" (Top Stories) في جوجل
 */
export function generateNewsArticleSchema(post: {
  title: string;
  excerpt?: string;
  content: string;
  image_url?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
  author?: string;
  slug?: string;
  id: string;
}): object {
  const date = new Date(post.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const postSlug = post.slug || post.id;

  const canonicalUrl = `${SEO_SITE_URL}/${year}/${month}/${day}/${postSlug}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": post.title,
    "description": post.excerpt || post.content.substring(0, 160),
    "image": [getPostImageOrLogo(post)],
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Person",
      "name": post.author || SEO_SITE_NAME
    },
    "publisher": {
      "@type": "Organization",
      "name": SEO_SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SEO_SITE_URL}/logo.png`
      }
    }
  };
}

/**
 * تنبيه محركات البحث بوجود محتوى جديد (Ping)
 */
export async function pingSearchEngines(sitemapUrl: string): Promise<{ google: boolean; bing: boolean }> {
  const results = { google: false, bing: false };
  try {
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { method: 'GET', mode: 'no-cors' });
    results.google = true;
  } catch (e) { console.error('Google ping failed:', e); }

  try {
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { method: 'GET', mode: 'no-cors' });
    results.bing = true;
  } catch (e) { console.error('Bing ping failed:', e); }

  return results;
}

/**
 * توليد الرابط الكنسي (Canonical URL)
 */
export function generateCanonicalUrl(post: { created_at: string; slug?: string; id: string }): string {
  const date = new Date(post.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const postSlug = post.slug || post.id;

  return `${SEO_SITE_URL}/${year}/${month}/${day}/${postSlug}`;
}
