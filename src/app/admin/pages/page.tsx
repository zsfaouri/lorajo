import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia, listAdminPages } from "@/lib/admin-data";

export default async function AdminPagesPage() {
  await requireAdmin();
  const [items, mediaAssets] = await Promise.all([listAdminPages(), listAdminMedia()]);

  return (
    <AdminResourceManager
      title="Pages"
      description="Create and manage website pages. After creating a page, open Edit to add text, photos, videos, forms, events, announcements, spacing, backgrounds, and layout sections."
      endpoint="/api/admin/pages"
      previewBasePath="/en"
      editBasePath="/admin/pages"
      initialItems={items}
      mediaAssets={mediaAssets}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug", placeholder: "new-page" },
        { name: "seoTitle", label: "SEO title" },
        { name: "seoDescription", label: "SEO description", type: "textarea" },
        { name: "seoImage", label: "SEO social image", type: "image" },
        statusField,
      ]}
    />
  );
}
