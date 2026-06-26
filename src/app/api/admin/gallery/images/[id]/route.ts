import { z } from "zod";

import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const galleryImageUpdateSchema = z.object({
  alt: z.string().min(1).optional(),
  caption: z.string().optional().nullable(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, galleryImageUpdateSchema);
  if (response) return response;

  const before = await prisma.galleryImage.findUnique({ where: { id } });
  const image = await prisma.galleryImage.update({
    where: { id },
    data: {
      ...(data.alt ? { alt: data.alt } : {}),
      caption: data.caption,
    },
    include: { mediaAsset: { select: { id: true, url: true, alt: true, caption: true, type: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user?.id,
      action: "update",
      entity: "GalleryImage",
      entityId: id,
      before: auditPayload(before),
      after: auditPayload(image),
    },
  });

  return ok(image);
}

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
