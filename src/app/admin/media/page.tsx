import { GalleryAlbumManager } from "@/components/admin/gallery-album-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { syncDriveGalleryToDatabase } from "@/lib/drive-gallery";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function MediaLibraryPage() {
  await requireAdmin();
  const prisma = getPrisma();
  if (prisma) {
    await syncDriveGalleryToDatabase(prisma).catch(() => null);
  }

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
        .then((collections) => collections.filter((collection) => collection.slug !== "hero-pics"))
    : [];

  return <GalleryAlbumManager initialCollections={collections} />;
}
