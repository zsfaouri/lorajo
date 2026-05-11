import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminPages } from "@/lib/admin-data";

export default async function AdminPagesPage() {
  await requireAdmin();
  const items = await listAdminPages();

  return (
    <AdminResourceManager
      title="Pages"
      description="Create bilingual pages, set SEO and draft/publish state. Sections control layout, spacing, theme, backgrounds, media, variants, and interactions."
      endpoint="/api/admin/pages"
      previewBasePath="/en"
      editBasePath="/admin/pages"
      initialItems={items}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug", placeholder: "new-page" },
        { name: "seoTitle", label: "SEO title" },
        { name: "seoDescription", label: "SEO description", type: "textarea" },
        statusField,
      ]}
    />
  );
}
