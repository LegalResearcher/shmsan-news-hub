import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["admin", "profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName || null, avatar_url: avatarUrl || null })
        .eq("id", user!.id);
      if (error) throw error;
      if (password) {
        const { error: passError } = await supabase.auth.updateUser({ password });
        if (passError) throw passError;
        setPassword("");
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث الملف الشخصي");
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="max-w-xl space-y-6"
    >
      <h1 className="text-xl font-extrabold">الملف الشخصي</h1>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label>البريد الإلكتروني</Label>
          <Input value={user?.email ?? ""} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_name">الاسم الظاهر</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar_url">رابط الصورة</Label>
          <Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة مرور جديدة (اختياري)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          حفظ
        </Button>
      </div>
    </form>
  );
}
