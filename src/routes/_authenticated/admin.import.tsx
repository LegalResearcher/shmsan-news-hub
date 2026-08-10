import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify, useCurrentUser } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/import")({
  component: ImportPage,
});

const sample = `[
  {
    "title": "عنوان الخبر",
    "excerpt": "مقدمة قصيرة",
    "content": "نص الخبر",
    "cover_image": "https://...",
    "status": "published"
  }
]`;

function ImportPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [value, setValue] = useState("");

  const run = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(value) as Record<string, unknown>[];
      if (!Array.isArray(parsed)) throw new Error("يجب أن يكون الملف مصفوفة JSON");
      const rows = parsed.map((item, index) => ({
        title: String(item['title'] ?? `خبر ${index + 1}`),
        slug: String(item['slug'] ?? (slugify(String(item['title'] ?? "")) || `post-${Date.now()}-${index}`)),
        excerpt: (item['excerpt'] as string) ?? null,
        content: (item['content'] as string) ?? null,
        cover_image: (item['cover_image'] as string) ?? null,
        status: (item['status'] as "draft" | "published" | "scheduled") ?? "draft",
        created_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("posts").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`تم استيراد ${count} خبرًا`);
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">استيراد أخبار من JSON</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          الصق مصفوفة JSON تحتوي على الأخبار المطلوب استيرادها.
        </p>
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <Label htmlFor="json">بيانات JSON</Label>
        <Textarea
          id="json"
          rows={14}
          dir="ltr"
          placeholder={sample}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono text-xs"
        />
        <Button onClick={() => run.mutate()} disabled={!value.trim() || run.isPending}>
          استيراد
        </Button>
      </div>
    </div>
  );
}
