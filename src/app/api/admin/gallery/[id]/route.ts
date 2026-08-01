import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.galleryCollection.findUniqueOrThrow({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          include: { mediaAsset: true },
        },
      },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.galleryCollection.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const collection = await prisma.galleryCollection.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "GalleryCollection", entityId: id, before, after: collection, metadata: { email } });
    return collection;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.galleryCollection.findUniqueOrThrow({ where: { id } });
    await prisma.galleryCollection.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "GalleryCollection", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
