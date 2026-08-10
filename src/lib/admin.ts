import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "editor";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}

export function useMyRoles() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as Role);
    },
  });
}

export function slugify(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 90);
}

export function useTableRows<T = Record<string, unknown>>(
  table: string,
  select = "*",
  orderBy = "created_at",
  ascending = false,
) {
  return useQuery({
    queryKey: ["admin", table, select, orderBy],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select(select)
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export async function uploadMedia(file: File, userId?: string) {
  const path = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  await supabase.from("media").insert({
    url: data.publicUrl,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userId ?? null,
  });
  return data.publicUrl;
}
