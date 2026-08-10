import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/admin/CrudManager";

export const Route = createFileRoute("/_authenticated/admin/ads")({
  component: () => (
    <CrudManager
      table="ads"
      title="الإعلانات"
      description="مواقع الإعلانات: header، sidebar، in_article، footer."
      fields={[
        { name: "name", label: "اسم الإعلان", required: true },
        {
          name: "placement",
          label: "الموضع",
          type: "select",
          required: true,
          options: [
            { value: "header", label: "أعلى الصفحة" },
            { value: "sidebar", label: "الشريط الجانبي" },
            { value: "in_article", label: "داخل الخبر" },
            { value: "footer", label: "أسفل الصفحة" },
          ],
        },
        { name: "is_active", label: "مُفعّل", type: "boolean" },
        { name: "image_url", label: "رابط الصورة" },
        { name: "link_url", label: "رابط الوجهة", hideInTable: true },
        { name: "html", label: "كود HTML بديل", type: "textarea", hideInTable: true },
      ]}
    />
  ),
});
