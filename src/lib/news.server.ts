import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const POST_FIELDS =
  "id,title,slug,excerpt,cover_image,published_at,views,is_featured,is_opinion,category:categories(name,slug),author:authors(name,slug,avatar_url)";