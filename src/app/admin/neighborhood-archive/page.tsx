import { AdminPageEditorLoader } from "@/components/admin/admin-page-editor-loader";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminNeighborhoodArchivePage() {
  await requireAdmin();
  return <AdminPageEditorLoader lookup={{ slug: "neighborhood-archive" }} />;
}
