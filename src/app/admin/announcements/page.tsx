import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminArticles, listAdminMedia } from "@/lib/admin-data";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const [items, mediaAssets] = await Promise.all([listAdminArticles(), listAdminMedia()]);

  return (
    <AdminResourceManager
      title="Announcements"
      description="Create announcements and articles. Published records can be surfaced by CMS sections and public lists."
      endpoint="/api/admin/articles"
      initialItems={items}
      mediaAssets={mediaAssets}
      fields={[
        localeField,
        { name: "title", label: "Title" },
        { name: "slug", label: "Slug" },
        { name: "summary", label: "Excerpt", type: "textarea" },
        { name: "imageUrl", label: "Announcement image", type: "image" },
        { name: "imageAlt", label: "Image alt text" },
        { name: "content", label: "Announcement text", type: "textarea", placeholder: "Write the announcement here." },
        statusField,
      ]}
    />
  );
}
