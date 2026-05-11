import { AdminResourceManager, localeField, statusField } from "@/components/admin/admin-resource-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMembers } from "@/lib/admin-data";

export default async function AdminMembersPage() {
  await requireAdmin();
  const items = await listAdminMembers();

  return (
    <AdminResourceManager
      title="Founding Members"
      description="Create and update founding member records. Public member sections read from these records."
      endpoint="/api/admin/members"
      initialItems={items}
      fields={[
        localeField,
        { name: "name", label: "Name" },
        { name: "slug", label: "Slug" },
        { name: "title", label: "Title" },
        { name: "sortOrder", label: "Sort order" },
        {
          name: "isFounder",
          label: "Founder",
          type: "select",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
        statusField,
      ]}
    />
  );
}
