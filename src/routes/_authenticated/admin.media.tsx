import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { uploadMedia, useCurrentUser, useTableRows } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaPage,
});

interface MediaRow {
  id: string;
  url: string;
  file_name: string | null;
  created_at: string;
}

function MediaPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: items = [] } = useTableRows<MediaRow>("media", "id,url,file_name,created_at");
  const [uploading, setUploading] = useState(false);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file, user?.id);
      }
      toast.success("تم رفع الملفات");
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold">مكتبة الوسائط</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ارفع الصور واستخدم روابطها في الأخبار والإعلانات.
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-10 text-sm text-muted-foreground">
        <Upload className="h-4 w-4" />
        {uploading ? "جاري الرفع..." : "اسحب الصور هنا أو اضغط للاختيار"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <img
              src={item.url}
              alt={item.file_name ?? "ملف وسائط"}
              className="aspect-video w-full object-cover"
              loading="lazy"
            />
            <figcaption className="space-y-2 p-3">
              <p className="truncate text-xs text-muted-foreground">{item.file_name}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    toast.success("تم نسخ الرابط");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> نسخ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("حذف الملف من المكتبة؟")) remove.mutate(item.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
