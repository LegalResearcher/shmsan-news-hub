import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const fields = [
  { name: "site_name", label: "اسم الموقع" },
  { name: "logo_url", label: "رابط الشعار" },
  { name: "seo_title", label: "عنوان SEO" },
  { name: "facebook", label: "فيسبوك" },
  { name: "twitter", label: "إكس / تويتر" },
  { name: "youtube", label: "يوتيوب" },
  { name: "telegram", label: "تيليجرام" },
  { name: "whatsapp", label: "واتساب" },
] as const;

function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) next[key] = (value as string) ?? "";
      setForm(next);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        id: 1,
        site_name: form.site_name || "شمسان نيوز",
        description: form.description || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        logo_url: form.logo_url || null,
        facebook: form.facebook || null,
        twitter: form.twitter || null,
        youtube: form.youtube || null,
        telegram: form.telegram || null,
        whatsapp: form.whatsapp || null,
      };
      const { error } = await supabase.from("site_settings").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      queryClient.invalidateQueries({ queryKey: ["admin", "site_settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6"
    >
      <h1 className="text-xl font-extrabold">إعدادات الموقع</h1>
      <div className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              value={form[field.name] ?? ""}
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">وصف الموقع</Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="seo_description">وصف SEO</Label>
          <Textarea
            id="seo_description"
            rows={3}
            value={form.seo_description ?? ""}
            onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </form>
  );
}
