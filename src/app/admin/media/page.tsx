import { GalleryAlbumManager } from "@/components/admin/gallery-album-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

export default async function MediaLibraryPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const collections = prisma
    ? await prisma.galleryCollection.findMany({
        include: {
          images: {
            include: { mediaAsset: { select: { id: true, url: true, alt: true, caption: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ locale: "asc" }, { sortOrder: "asc" }],
      })
    : [];

  return <GalleryAlbumManager initialCollections={collections} />;
}
