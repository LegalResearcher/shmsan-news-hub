import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://shmsannews.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * توافقٌ اسمي مع العملاء القدامى فقط.
 * Google Indexing API غير مخصص للمقالات الإخبارية العادية؛ اكتشاف الأخبار
 * يتم من خلال Sitemap وNews Sitemap وRSS والرابط القانوني الثابت.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "يجب إرسال مصفوفة غير فارغة من الروابط" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = urls.map((value: unknown) => {
      const url = String(value || "");
      const valid = url.startsWith(`${SITE_URL}/`);
      return {
        url,
        success: valid,
        discovery_ready: valid,
        message: valid
          ? "جاهز للاكتشاف عبر Sitemap وNews Sitemap وRSS."
          : "الرابط لا ينتمي إلى النطاق القانوني للموقع.",
      };
    });

    return new Response(
      JSON.stringify({
        success: results.every((result) => result.success),
        discovery: "لا يتم إرسال طلب Google Indexing API للمقالات الإخبارية العادية.",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Discovery signal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "طلب غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
