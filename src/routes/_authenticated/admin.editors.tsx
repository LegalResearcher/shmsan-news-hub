import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMyRoles } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/editors")({
  component: EditorsPage,
});

function EditorsPage() {
  const queryClient = useQueryClient();
  const { data: myRoles = [] } = useMyRoles();
  const isAdmin = myRoles.includes("admin");

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "editors"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id,display_name,email,created_at"),
        supabase.from("user_roles").select("id,user_id,role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      return (profiles.data ?? []).map((profile) => ({
        ...profile,
        roles: (roles.data ?? []).filter((r) => r.user_id === profile.id),
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "editor" | "none" }) => {
      const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delError) throw delError;
      if (role !== "none") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية");
      queryClient.invalidateQueries({ queryKey: ["admin", "editors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">إدارة المحررين</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "امنح المستخدمين دور مدير أو محرر أو اسحب الصلاحية."
            : "عرض فقط — تغيير الصلاحيات متاح للمديرين."}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-bold">المستخدم</th>
              <th className="px-4 py-3 text-start font-bold">البريد</th>
              <th className="px-4 py-3 text-start font-bold">الصلاحية</th>
              <th className="px-4 py-3 text-start font-bold">تعيين</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const current = row.roles[0]?.role ?? "none";
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {current === "admin" ? "مدير" : current === "editor" ? "محرر" : "قارئ"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(["admin", "editor", "none"] as const).map((role) => (
                        <Button
                          key={role}
                          size="sm"
                          variant={current === role ? "default" : "outline"}
                          disabled={!isAdmin || setRole.isPending}
                          onClick={() => setRole.mutate({ userId: row.id, role })}
                        >
                          {role === "admin" ? "مدير" : role === "editor" ? "محرر" : "إزالة"}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
