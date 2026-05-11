import { auditPayload, error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const before = await prisma.galleryImage.findUnique({ where: { id } });
  await prisma.galleryImage.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: session.user?.id,
      action: "delete",
      entity: "GalleryImage",
      entityId: id,
      before: auditPayload(before),
    },
  });

  return ok({ deleted: true });
}
