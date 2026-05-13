import { error, ok, requireAdminApi } from "@/lib/api-utils";
import { createGoogleDriveFolder, DEFAULT_GOOGLE_DRIVE_FOLDER_ID, listGoogleDriveFolder } from "@/lib/google-drive";

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

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return error("Folder name is required.", 422);

  const folder = await createGoogleDriveFolder(name);
  if (!folder) return error("Google Drive write access is not configured. Create the folder in Drive, then click Sync Google Drive.", 503);

  return ok(folder, { status: 201 });
}
