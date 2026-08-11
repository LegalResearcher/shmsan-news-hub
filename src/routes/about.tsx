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
            «شمسان نيوز» بوابة إخبارية جنوبية مستقلة تأسست لتقديم خبر دقيق وسريع، بعيدًا عن الإثارة
            والتضليل، وبمعايير مهنية تضع القارئ في المقدمة.
          </p>
          <h2>رسالتنا</h2>
          <p>
            نقل الحقيقة كما هي، وإتاحة مساحة للرأي والتحليل، وتوثيق ما يحدث في محيطنا المحلي بعمق
            وإنصاف.
          </p>
          <h2>سياستنا التحريرية</h2>
          <p>
            نتحقق من كل معلومة قبل نشرها، ونفصل بوضوح بين الخبر والرأي، ونصحح أخطاءنا بشفافية عند
            حدوثها.
          </p>
          <h2>تواصل معنا</h2>
          <p>للمراسلات التحريرية والإعلانات: news@shamsan.example</p>
        </div>
      </div>
    </SiteShell>
  );
}
