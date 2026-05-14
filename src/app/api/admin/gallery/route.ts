import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(
    await prisma.galleryCollection.findMany({
      where: { slug: { not: "hero-pics" } },
      include: { images: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ locale: "asc" }, { sortOrder: "asc" }],
    }),
  );
}

export async function POST() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  return error("Create the category as a folder inside Google Drive, then click Sync Google Drive in Image Cloud.", 409);
}
