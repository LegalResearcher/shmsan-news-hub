import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { slugify, uploadMedia, useCurrentUser, useTableRows } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  component: PostEditor,
});

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category_id: string;
  author_id: string;
  status: "draft" | "published" | "scheduled";
  is_featured: boolean;
  is_opinion: boolean;
  published_at: string;
  seo_title: string;
  seo_description: string;
}

const empty: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category_id: "",
  author_id: "",
  status: "draft",
  is_featured: false,
  is_opinion: false,
  published_at: new Date().toISOString().slice(0, 16),
  seo_title: "",
  seo_description: "",
};

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [form, setForm] = useState<FormState>(empty);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useTableRows<{ id: string; name: string }>(
    "categories",
    "id,name",
    "sort_order",
    true,
  );
  const { data: authors = [] } = useTableRows<{ id: string; name: string }>(
    "authors",
    "id,name",
    "name",
    true,
  );

  const { data: post } = useQuery({
    queryKey: ["admin", "post", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!post) return;
    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      cover_image: post.cover_image ?? "",
      category_id: post.category_id ?? "",
      author_id: post.author_id ?? "",
      status: post.status,
      is_featured: post.is_featured,
      is_opinion: post.is_opinion,
      published_at: new Date(post.published_at).toISOString().slice(0, 16),
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
    });
  }, [post]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title) || `post-${Date.now()}`,
        excerpt: form.excerpt || null,
        content: form.content || null,
        cover_image: form.cover_image || null,
        category_id: form.category_id || null,
        author_id: form.author_id || null,
        status: form.status,
        is_featured: form.is_featured,
        is_opinion: form.is_opinion,
        published_at: new Date(form.published_at).toISOString(),
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      };
      if (isNew) {
        const { data, error } = await supabase
          .from("posts")
          .insert({ ...payload, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (savedId) => {
      toast.success("تم حفظ الخبر");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (isNew) navigate({ to: "/admin/posts/$id", params: { id: savedId } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadMedia(file, user?.id);
      setForm((prev) => ({ ...prev, cover_image: url }));
      toast.success("تم رفع الصورة");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6"
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h1 className="truncate text-xl font-extrabold">
          {isNew ? "خبر جديد" : "تعديل الخبر"}
        </h1>
        <Button type="submit" disabled={save.isPending} className="shrink-0">
          حفظ
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="title">العنوان</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                  slug: prev.slug || slugify(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">المعرّف في الرابط</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">المقدمة</Label>
            <Textarea
              id="excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">نص الخبر</Label>
            <Textarea
              id="content"
              rows={16}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="اكتب فقرات الخبر، ويمكنك استخدام وسوم HTML البسيطة مثل <p> و <strong>."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as FormState["status"] })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="scheduled">مجدول</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="published_at">تاريخ النشر</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">القسم</Label>
              <select
                id="category_id"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— بدون —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="author_id">الكاتب</Label>
              <select
                id="author_id"
                value={form.author_id}
                onChange={(e) => setForm({ ...form, author_id: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— بدون —</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_featured">خبر رئيسي (سلايدر)</Label>
              <Switch
                id="is_featured"
                checked={form.is_featured}
                onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_opinion">مقال رأي</Label>
              <Switch
                id="is_opinion"
                checked={form.is_opinion}
                onCheckedChange={(v) => setForm({ ...form, is_opinion: v })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-5">
            <Label htmlFor="cover_image">صورة الغلاف</Label>
            {form.cover_image ? (
              <img
                src={form.cover_image}
                alt="معاينة صورة الغلاف"
                className="aspect-video w-full rounded object-cover"
              />
            ) : null}
            <Input
              id="cover_image"
              placeholder="https://..."
              value={form.cover_image}
              onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
            />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-border py-3 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              {uploading ? "جاري الرفع..." : "رفع صورة من الجهاز"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="seo_title">عنوان SEO</Label>
              <Input
                id="seo_title"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">وصف SEO</Label>
              <Textarea
                id="seo_description"
                rows={3}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
