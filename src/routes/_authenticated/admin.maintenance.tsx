import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin", "maintenance"],
    queryFn: async () => {
      const [drafts, orphans, noCover] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("posts").select("id", { count: "exact", head: true }).is("category_id", null),
        supabase.from("posts").select("id", { count: "exact", head: true }).is("cover_image", null),
      ]);
      return {
        drafts: drafts.count ?? 0,
        orphans: orphans.count ?? 0,
        noCover: noCover.count ?? 0,
      };
    },
  });

  const archiveOld = useMutation({
    mutationFn: async () => {
      const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();
      const { error } = await supabase
        .from("posts")
        .update({ status: "draft" })
        .lt("published_at", cutoff)
        .eq("status", "published");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تمت أرشفة الأخبار الأقدم من سنة");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteDrafts = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("status", "draft");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف المسودات");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">الصيانة والأرشفة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أدوات لتنظيف المحتوى وأرشفة الأخبار القديمة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="مسودات" value={data?.drafts ?? 0} />
        <Stat label="أخبار بدون قسم" value={data?.orphans ?? 0} />
        <Stat label="أخبار بدون صورة" value={data?.noCover ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-5">
        <Button variant="outline" onClick={() => archiveOld.mutate()} disabled={archiveOld.isPending}>
          أرشفة الأخبار الأقدم من سنة
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("سيتم حذف جميع المسودات نهائيًا. متابعة؟")) deleteDrafts.mutate();
          }}
          disabled={deleteDrafts.isPending}
        >
          حذف كل المسودات
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-black">{value.toLocaleString("ar")}</p>
    </div>
  );
}
