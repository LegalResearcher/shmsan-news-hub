import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatArabicDate } from "@/lib/news.types";

export const Route = createFileRoute("/_authenticated/admin/posts/")({
  component: PostsList,
});

const statusLabel: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  scheduled: "مجدول",
};

function PostsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin", "posts", search, status],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("id,title,status,published_at,views,is_featured,categories(name)")
        .order("published_at", { ascending: false })
        .limit(100);
      if (search) query = query.ilike("title", `%${search}%`);
      if (status) query = query.eq("status", status as "draft");
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الخبر");
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h1 className="truncate text-xl font-extrabold">الأخبار</h1>
        <Button asChild className="shrink-0">
          <Link to="/admin/posts/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4" /> خبر جديد
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="بحث بالعنوان..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
          <option value="scheduled">مجدول</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-bold">العنوان</th>
              <th className="px-4 py-3 text-start font-bold">القسم</th>
              <th className="px-4 py-3 text-start font-bold">الحالة</th>
              <th className="px-4 py-3 text-start font-bold">التاريخ</th>
              <th className="px-4 py-3 text-start font-bold">المشاهدات</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد أخبار
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="max-w-80 truncate px-4 py-3 font-semibold">{post.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(post.categories as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{statusLabel[post.status] ?? post.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatArabicDate(post.published_at)}
                  </td>
                  <td className="px-4 py-3">{(post.views ?? 0).toLocaleString("ar")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button asChild size="icon" variant="outline" aria-label="تعديل">
                        <Link to="/admin/posts/$id" params={{ id: post.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="حذف"
                        onClick={() => {
                          if (confirm("تأكيد حذف الخبر؟")) remove.mutate(post.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
