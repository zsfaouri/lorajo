import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { syncDriveGalleryToDatabase, syncSingleFolderToDatabase } from "@/lib/drive-gallery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  try {
    const body = await request.json().catch(() => null);
    const folderId = typeof body?.folderId === "string" ? body.folderId.trim() : "";
    if (folderId) return ok(await syncSingleFolderToDatabase(prisma, folderId));
    const result = await syncDriveGalleryToDatabase(prisma);
    return ok(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-drive] error:", message);
    return error(`Sync failed: ${message}`, 500);
  }
}
