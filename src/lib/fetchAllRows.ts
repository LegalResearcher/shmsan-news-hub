/**
 * يجلب كل الصفوف المطابقة لاستعلام Supabase عبر تصفّح تلقائي بدفعات (Pagination)،
 * بدل الاكتفاء بأول 1000 صف فقط.
 *
 * لماذا هذا ضروري: Supabase/PostgREST يفرض حد 1000 صف كحد أقصى لأي طلب select
 * لا يستخدم range صريحاً. أي استعلام "اجلب كل شيء" بدون هذه الدالة سيتوقف بصمت
 * عند أول 1000 صف — وقد يكون الترتيب تصاعدياً أو تنازلياً حسب الفهرس المستخدم،
 * فتُفقد إما أقدم البيانات أو أحدثها دون أي خطأ ظاهر.
 *
 * الاستخدام:
 *   const posts = await fetchAllRows((from, to) =>
 *     supabase.from("posts").select("*").order("created_at", { ascending: false }).range(from, to)
 *   );
 */
export async function fetchAllRows<T = any>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<T[]> {
  let all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break; // دفعة أقل من الحد الأقصى => وصلنا آخر البيانات
    from += pageSize;
  }
  return all;
}
