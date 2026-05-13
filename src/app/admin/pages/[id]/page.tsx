import { AdminPageEditorLoader } from "@/components/admin/admin-page-editor-loader";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminPageEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return <AdminPageEditorLoader lookup={{ id }} />;
}
