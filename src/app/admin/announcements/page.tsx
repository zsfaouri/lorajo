import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminArticles } from "@/lib/admin-data";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const items = await listAdminArticles();

  return (
    <AdminResourceManager
      title="Announcements"
      description="Create announcements and articles. Published records can be surfaced by CMS sections and public lists."
      endpoint="/api/admin/articles"
      initialItems={items}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "summary", label: "Excerpt", type: "textarea" },
        { name: "content", label: "Announcement text", type: "textarea", placeholder: "Write the announcement here." },
        statusField,
      ]}
    />
  );
}
