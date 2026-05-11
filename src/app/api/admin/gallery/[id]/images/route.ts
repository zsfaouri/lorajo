import { z } from "zod";

import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const galleryImageSchema = z.object({
  mediaAssetId: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional().nullable(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, galleryImageSchema);
  if (response) return response;

  const existingCount = await prisma.galleryImage.count({ where: { collectionId: id } });
  const image = await prisma.galleryImage.create({
    data: {
      collectionId: id,
      mediaAssetId: data.mediaAssetId,
      alt: data.alt,
      caption: data.caption,
      sortOrder: existingCount + 1,
    },
    include: { mediaAsset: { select: { id: true, url: true, alt: true, caption: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user?.id,
      action: "create",
      entity: "GalleryImage",
      entityId: image.id,
      after: auditPayload(image),
    },
  });

  return ok(image, { status: 201 });
}
