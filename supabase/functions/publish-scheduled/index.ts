import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://shmsannews.com";
const YEMEN_OFFSET_MS = 3 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getCanonicalPath(post: { id: string; published_at?: string | null; created_at?: string | null; slug?: string | null }): string {
  const timestamp = post.published_at || post.created_at || new Date().toISOString();
  const shifted = new Date(new Date(timestamp).getTime() + YEMEN_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `/${year}/${month}/${day}/${post.slug || post.id}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const now = new Date().toISOString();
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("posts")
      .select("id,title,slug,created_at,published_at,scheduled_at")
      .eq("status", "scheduled")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) throw fetchError;
    if (!scheduledPosts?.length) {
      return new Response(JSON.stringify({ success: true, message: "No posts to publish", published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const post of scheduledPosts) {
      try {
        // وقت النشر القانوني هو وقت الجدولة الفعلي بعد استحقاق النشر، وليس created_at.
        const publishedAt = post.scheduled_at || now;
        const { error: updateError } = await supabase
          .from("posts")
          .update({ status: "published", published_at: publishedAt, scheduled_at: null, updated_at: now })
          .eq("id", post.id);
        if (updateError) throw updateError;

        const canonicalUrl = `${SITE_URL}${getCanonicalPath({ ...post, published_at: publishedAt })}`;
        console.log(`Published and discovery-ready: ${canonicalUrl}`);
        results.push({ id: post.id, title: post.title, success: true, url: canonicalUrl, discovery_ready: true });
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
        results.push({
          id: post.id,
          title: post.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((result) => result.success).length;
    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${successCount} of ${scheduledPosts.length} posts`,
        published: successCount,
        discovery: "Published posts are available through Sitemap, News Sitemap, and RSS.",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Publish scheduled posts error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
