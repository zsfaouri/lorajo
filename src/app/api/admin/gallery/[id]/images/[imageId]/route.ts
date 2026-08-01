import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { imageId } = await params;
  return withAdmin(async ({ prisma }) => {
    const body = await parseBody<Record<string, any>>(req);
    return prisma.galleryImage.update({
      where: { id: imageId },
      data: body,
      include: { mediaAsset: true },
    });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { imageId } = await params;
  return withAdmin(async ({ prisma }) => {
    await prisma.galleryImage.delete({ where: { id: imageId } });
    return { deleted: true };
  });
}
