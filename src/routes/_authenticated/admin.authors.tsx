import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/CrudManager";

export const Route = createFileRoute("/_authenticated/admin/authors")({
  component: () => (
    <CrudManager
      table="authors"
      title="الكتّاب"
      description="بيانات كتّاب المقالات والأخبار."
      fields={[
        { name: "name", label: "الاسم", required: true },
        { name: "slug", label: "المعرّف (بالإنجليزية)", required: true },
        { name: "avatar_url", label: "رابط الصورة" },
        { name: "bio", label: "نبذة", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
