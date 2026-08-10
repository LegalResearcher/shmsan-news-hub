import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/CrudManager";

export const Route = createFileRoute("/_authenticated/admin/breaking")({
  component: () => (
    <CrudManager
      table="breaking_news"
      title="الأخبار العاجلة"
      description="النصوص التي تظهر في الشريط المتحرك أعلى الموقع."
      orderBy="sort_order"
      ascending
      fields={[
        { name: "text", label: "نص الخبر العاجل", required: true },
        { name: "link", label: "الرابط" },
        { name: "is_active", label: "مُفعّل", type: "boolean" },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ]}
    />
  ),
});
