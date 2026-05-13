import { AdminPageEditorLoader } from "@/components/admin/admin-page-editor-loader";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminWhatWeDoPage() {
  await requireAdmin();
  return <AdminPageEditorLoader lookup={{ slug: "what-we-do" }} />;
}
