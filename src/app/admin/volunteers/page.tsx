import { AdminReadonlyList } from "@/components/admin/admin-readonly-list";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminVolunteers } from "@/lib/admin-data";

export default async function AdminVolunteersPage() {
  await requireAdmin();
  const items = await listAdminVolunteers();
  return <AdminReadonlyList title="Volunteer Applications" description="Volunteer application submissions and interests." items={items} />;
}
