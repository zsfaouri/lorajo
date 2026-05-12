import { error, ok, requireAdminApi } from "@/lib/api-utils";
import { DEFAULT_GOOGLE_DRIVE_FOLDER_ID, listGoogleDriveFolder } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") || DEFAULT_GOOGLE_DRIVE_FOLDER_ID;
  const refreshKey = searchParams.get("refresh") || "";

  try {
    return ok({
      folderId,
      rootFolderId: DEFAULT_GOOGLE_DRIVE_FOLDER_ID,
      items: await listGoogleDriveFolder(folderId, refreshKey),
    });
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "Could not read Google Drive folder.", 503);
  }
}
