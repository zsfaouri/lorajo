import { MediaLibraryManager } from "@/components/admin/media-library-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia } from "@/lib/admin-data";

export default async function MediaLibraryPage() {
  await requireAdmin();
  const assets = await listAdminMedia();
  return <MediaLibraryManager initialAssets={assets} />;
}
