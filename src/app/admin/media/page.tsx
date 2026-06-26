import { GalleryAlbumManager } from "@/components/admin/gallery-album-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { syncDriveGalleryToDatabase } from "@/lib/drive-gallery";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function MediaLibraryPage() {
  await requireAdmin();
  const prisma = getPrisma();

  async function loadCollections() {
    if (!prisma) return [];
    try {
      const collections = await prisma.galleryCollection.findMany({
        include: {
          images: {
            include: { mediaAsset: { select: { id: true, url: true, alt: true, caption: true, type: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ locale: "asc" }, { sortOrder: "asc" }],
      });
      return collections.filter((collection) => collection.slug !== "hero-pics");
    } catch (error) {
      console.error("[admin/media] load collections failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }

  let collections = await loadCollections();
  if (prisma && collections.length === 0) {
    await syncDriveGalleryToDatabase(prisma).catch((error: unknown) => {
      console.error("[admin/media] bootstrap sync failed:", error instanceof Error ? error.message : error);
    });
    collections = await loadCollections();
  }

  const mediaAssets = prisma
    ? await prisma.mediaAsset.findMany({ where: { type: { in: ["IMAGE", "VIDEO"] }, source: "google drive" }, orderBy: { createdAt: "desc" } }).catch((error: unknown) => {
        console.error("[admin/media] load assets failed:", error instanceof Error ? error.message : error);
        return [];
      })
    : [];

  return <GalleryAlbumManager initialCollections={collections} mediaAssets={mediaAssets} />;
}
