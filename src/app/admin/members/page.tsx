import { MemberManager } from "@/components/admin/member-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia, listAdminMembers } from "@/lib/admin-data";
import { DRIVE_FOLDER_REGISTRY } from "@/lib/drive-folders";

export default async function AdminMembersPage() {
  await requireAdmin();
  const [items, mediaAssets] = await Promise.all([listAdminMembers(), listAdminMedia()]);

  return <MemberManager initialMembers={items} mediaAssets={mediaAssets} folderId={DRIVE_FOLDER_REGISTRY["founding-members"]} />;
}
