import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.galleryImage.findMany({
      where: { collectionId: id },
      orderBy: { sortOrder: "asc" },
      include: { mediaAsset: true },
    });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    const body = await parseBody<{
      mediaAssetId: string;
      alt: string;
      caption?: string;
      sortOrder?: number;
    }>(req);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.galleryImage.findFirst({
        where: { collectionId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    return prisma.galleryImage.create({
      data: {
        collectionId: id,
        mediaAssetId: body.mediaAssetId,
        alt: body.alt,
        caption: body.caption,
        sortOrder,
      },
      include: { mediaAsset: true },
    });
  });
}
