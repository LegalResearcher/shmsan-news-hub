import { createFileRoute } from "@tanstack/react-router";
import { publicClient } from "@/lib/news.server";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SITE_NAME = "شمسان نيوز";
// بوتات مواقع التواصل التي تحتاج صفحة HTML ثابتة فيها OG/Twitter meta بدل تحويل مباشر
const SOCIAL_BOT_PATTERN =
  /facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|slackbot|discordbot/i;

export const Route = createFileRoute("/share/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const origin = new URL(request.url).origin;
        const db = publicClient();

        const { data: post } = await db
          .from("posts")
          .select("id,title,excerpt,cover_image,slug,created_at,published_at,seo_title,seo_description")
          .eq("id", params.id)
          .eq("status", "published")
          .maybeSingle();

        if (!post) {
          return Response.redirect(origin, 302);
        }

        const dateUsed = post.published_at || post.created_at;
        const d = new Date(dateUsed);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const slug = post.slug || post.id;

        // الرابط الحقيقي للخبر (عربي غير مشفّر) - وجهة التحويل النهائية
        const canonicalUrl = `${origin}/${y}/${m}/${day}/${slug}`;
        // رابط المشاركة القصير الثابت (ASCII بالكامل) - يُستخدم في نص التغريدة
        const shareUrl = `${origin}/share/${post.id}`;

        const title = escapeHtml(post.seo_title ?? post.title ?? SITE_NAME);
        const description = escapeHtml(post.seo_description ?? post.excerpt ?? "تقرير من شمسان نيوز.");
        const image = post.cover_image?.startsWith("https://") ? post.cover_image : `${origin}/logo.png`;

        const ua = request.headers.get("user-agent") ?? "";
        const isSocialBot = SOCIAL_BOT_PATTERN.test(ua);

        // بوتات التواصل (تويتر/فيسبوك/تليجرام..) تحتاج صفحة ثابتة فيها الميتاداتا مباشرة
        if (isSocialBot) {
          return new Response(
            `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>${title} | ${SITE_NAME}</title>
<meta name="description" content="${description}"/>

<meta property="og:type" content="article"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:locale" content="ar_AR"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:url" content="${shareUrl}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>

<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${image}"/>

<link rel="canonical" href="${canonicalUrl}"/>
</head>
<body></body>
</html>`,
            { headers: { "content-type": "text/html; charset=utf-8" }, status: 200 },
          );
        }

        // المستخدم العادي (والزوار من الرابط بعد فتحه) يُحوَّل مباشرة للخبر الحقيقي
        return Response.redirect(encodeURI(canonicalUrl), 302);
      },
    },
  },
});
