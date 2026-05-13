import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia, listAdminProjects } from "@/lib/admin-data";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const [items, mediaAssets] = await Promise.all([listAdminProjects(), listAdminMedia()]);

  return (
    <AdminResourceManager
      title="Projects"
      description="Create local initiatives, heritage programs, economic projects, and community work records."
      endpoint="/api/admin/projects"
      initialItems={items}
      mediaAssets={mediaAssets}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "summary", label: "Summary", type: "textarea" },
        { name: "imageUrl", label: "Project image", type: "image" },
        { name: "imageAlt", label: "Image alt text" },
        { name: "content", label: "Project details", type: "textarea" },
        statusField,
      ]}
    />
  );
}
