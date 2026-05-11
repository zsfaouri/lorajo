import { AdminReadonlyList } from "@/components/admin/admin-readonly-list";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminSubscribers } from "@/lib/admin-data";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const items = await listAdminSubscribers();
  return <AdminReadonlyList title="Newsletter Subscribers" description="Subscriber records from the public newsletter form." items={items} />;
}
