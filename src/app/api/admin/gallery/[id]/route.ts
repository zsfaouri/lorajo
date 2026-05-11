import { PublishState } from "@prisma/client";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { collectionSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  const { data, response } = await parseJson(request, collectionSchema.partial());
  if (response) return response;

  const collection = await prisma.galleryCollection.update({
    where: { id },
    data: { ...data, status: data.status as PublishState | undefined },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "update", entity: "GalleryCollection", entityId: id } });
  return ok(collection);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  await prisma.galleryCollection.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "delete", entity: "GalleryCollection", entityId: id } });
  return ok({ deleted: true });
}
