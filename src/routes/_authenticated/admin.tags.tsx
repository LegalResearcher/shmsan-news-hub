import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/CrudManager";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  component: () => (
    <CrudManager
      table="tags"
      title="الوسوم"
      description="وسوم تُستخدم لتجميع الأخبار المتشابهة."
      fields={[
        { name: "name", label: "الوسم", required: true },
        { name: "slug", label: "المعرّف (بالإنجليزية)", required: true },
      ]}
    />
  ),
});
