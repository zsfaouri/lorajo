import { GalleryAlbumManager } from "@/components/admin/gallery-album-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export default async function AdminGalleryPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const [collections, mediaAssets] = prisma
    ? await Promise.all([
        prisma.galleryCollection.findMany({
          include: {
            images: {
              include: { mediaAsset: { select: { id: true, url: true, alt: true, caption: true } } },
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: [{ locale: "asc" }, { sortOrder: "asc" }],
        }),
        prisma.mediaAsset.findMany({
          where: { type: "IMAGE" },
          select: { id: true, url: true, alt: true, caption: true },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  return <GalleryAlbumManager initialCollections={collections} mediaAssets={mediaAssets} />;
}
