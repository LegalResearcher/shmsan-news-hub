import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { SectionHeading } from "@/components/site/SectionHeading";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | شمسان نيوز" },
      {
        name: "description",
        content: "تعرّف على رسالة شمسان نيوز وسياستها التحريرية وفريق العمل وطرق التواصل.",
      },
      { property: "og:title", content: "من نحن | شمسان نيوز" },
      { property: "og:description", content: "رسالتنا وسياستنا التحريرية في شمسان نيوز." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SectionHeading title="من نحن" />
        <div className="article-body">
          <p>
            <strong>«شمسان نيوز»</strong> منصة إخبارية مستقلة تُعنى بتغطية الأحداث والمستجدات في
            الجنوب والمنطقة. نلتزم بتقديم صحافة دقيقة، سريعة وموضوعية، ترتكز على أعلى المعايير
            المهنية وتضع القارئ في قلب الحدث.
          </p>
          <h2>رسالتنا</h2>
          <p>
            تقديم تغطية إخبارية متكاملة تتسم بالنزاهة والحياد، مع توفير مساحة تحريرية موثوقة
            للتحليل وإبداء الرأي، لتوثيق التحولات المحلية والإقليمية بعمق وإنصاف.
          </p>
          <h2>سياساتنا التحريرية</h2>
          <p>
            نعتمد على التحقق الصارم من المصادر والمعلومات قبل النشر، ونلتزم بالفصل التام بين الخبر
            الميداني والرأي الشارح. كما نعتمد مبدأ الشفافية الكاملة في تصحيح أي أخطاء تحريرية فور
            وقوعها.
          </p>
          <h2>تواصل معنا</h2>
          <p>
            <strong>للتواصل مع التحرير والاستفسارات الإعلانية:</strong>
            <br />
            news@shamsan.example
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
