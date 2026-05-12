import { AdminControlPanel } from "@/components/admin/admin-control-panel";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminFooterColumns, listAdminRoles, listAdminUsers } from "@/lib/admin-data";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readSocialLinks(columns: Awaited<ReturnType<typeof listAdminFooterColumns>>) {
  const content = columns.find((column) => column.locale === "EN")?.content;
  const record = content && typeof content === "object" && !Array.isArray(content) ? content : {};
  const social = "socialLinks" in record && typeof record.socialLinks === "object" && record.socialLinks && !Array.isArray(record.socialLinks)
    ? record.socialLinks as Record<string, unknown>
    : {};

  return {
    instagram: readString(social.instagram),
    facebook: readString(social.facebook),
    linkedin: readString(social.linkedin),
    x: readString(social.x),
  };
}

export default async function AdminControlPage() {
  const session = await requireAdmin();
  const [users, roles, footerColumns] = await Promise.all([listAdminUsers(), listAdminRoles(), listAdminFooterColumns()]);

  return (
    <AdminControlPanel
      currentEmail={session.user?.email ?? ""}
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.role ? { name: user.role.name } : null,
      }))}
      roles={roles.map((role) => ({ id: role.id, name: role.name, permissions: role.permissions }))}
      socialLinks={readSocialLinks(footerColumns)}
    />
  );
}
