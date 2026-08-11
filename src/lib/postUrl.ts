/**
 * وظائف مساعدة لإنشاء وتحليل روابط المقالات المبنية على التاريخ
 * التنسيق المعتمد: /YYYY/MM/DD/slug (بدون مائلة نهائية)
 */

// 1. توليد الـ Slug من العنوان (يدعم العربية والإنجليزية)
export function generateSlug(title: string): string {
  // إزالة الرموز الخاصة مع الحفاظ على الحروف العربية والإنجليزية والأرقام
  let result = title.replace(/[^\u0600-\u06FF\w\s-]/g, '');
  // استبدال المسافات بشرطات
  result = result.replace(/\s+/g, '-');
  // منع تكرار الشرطات المتتالية
  result = result.replace(/-+/g, '-');
  // تنظيف الأطراف من الشرطات
  result = result.replace(/^-+|-+$/g, '');
  // تحديد طول الرابط بـ 100 حرف لضمان ثبات الأرشفة
  return result.substring(0, 100);
}

// 2. إنشاء الرابط الكامل بناءً على التاريخ (بدون مائلة نهائية)
export function getPostUrl(post: { 
  id: string; 
  created_at: string; 
  slug?: string | null; 
  title?: string;
}): string {
  const date = new Date(post.created_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // الأولوية للـ slug المخزن، ثم توليد واحد من العنوان، ثم الـ ID كخيار أخير
  const slug = post.slug || (post.title ? generateSlug(post.title) : post.id);
  
  // تم التأكد هنا من عدم إضافة / في النهاية ليتطابق مع الـ Canonical والـ Sitemap
  return `/${year}/${month}/${day}/${encodeURIComponent(slug)}`;
}

// 3. تحليل الرابط لاستخراج المكونات (مفيد في صفحات العرض)
export function parseDateUrl(year: string, month: string, day: string, slug: string): {
  year: number;
  month: number;
  day: number;
  slug: string;
} | null {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  
  // التحقق من صحة أرقام التاريخ لضمان عدم حدوث أخطاء برمجية
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (y < 2020 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  
  return { year: y, month: m, day: d, slug: decodeURIComponent(slug) };
}

// 4. التحقق مما إذا كان الجزء الأول من الرابط هو سنة (لأغراض التوجيه/Routing)
export function isDatePath(segment: string): boolean {
  const num = parseInt(segment, 10);
  // نعتبر الروابط تبدأ من عام 2024 فصاعداً لموقع شمسان نيوز
  return !isNaN(num) && num >= 2024 && num <= 2100;
}
