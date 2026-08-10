import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/CrudManager";
import { useTableRows } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: cats = [] } = useTableRows<{ id: string; name: string }>(
    "categories",
    "id,name",
    "sort_order",
    true,
  );

  return (
    <CrudManager
      table="categories"
      title="الأقسام"
      description="أضف الأقسام الرئيسية والفرعية وحدد ترتيب ظهورها في القائمة."
      orderBy="sort_order"
      ascending
      fields={[
        { name: "name", label: "اسم القسم", required: true },
        { name: "slug", label: "المعرّف (بالإنجليزية)", required: true, placeholder: "politics" },
        { name: "sort_order", label: "الترتيب", type: "number" },
        {
          name: "parent_id",
          label: "القسم الأب",
          type: "select",
          options: cats.map((c) => ({ value: c.id, label: c.name })),
        },
        { name: "description", label: "الوصف", type: "textarea", hideInTable: true },
      ]}
    />
  );
}
