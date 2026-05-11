import { PublishState } from "@prisma/client";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { collectionSchema } from "@/lib/validations";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.galleryCollection.findMany({ include: { images: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } } }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { data, response } = await parseJson(request, collectionSchema);
  if (response) return response;

  const collection = await prisma.galleryCollection.create({
    data: { ...data, status: data.status as PublishState },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "GalleryCollection", entityId: collection.id } });
  return ok(collection, { status: 201 });
}
