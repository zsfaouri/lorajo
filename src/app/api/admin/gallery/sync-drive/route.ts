import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { syncDriveGalleryToDatabase } from "@/lib/drive-gallery";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const result = await syncDriveGalleryToDatabase(prisma);
  return ok(result);
}
