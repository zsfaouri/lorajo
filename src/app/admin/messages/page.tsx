import { AdminReadonlyList } from "@/components/admin/admin-readonly-list";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMessages } from "@/lib/admin-data";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const items = await listAdminMessages();
  return <AdminReadonlyList title="Contact Messages" description="Inbox for public contact form submissions." items={items} />;
}
