import { Locale, MediaType, PublishState, type PrismaClient } from "@prisma/client";

import { canonicalGallerySlug } from "@/lib/gallery-slugs";
import { listGoogleDriveFolder } from "@/lib/google-drive";
import type { GalleryCollectionDto, NeighborhoodArchiveItem } from "@/types/cms";

const publicGallerySlugs = new Set(["famous-figures", "historical-photos", "landmarks"]);

export function driveCollectionTitle(name: string) {
  const slug = canonicalGallerySlug(name);
  if (slug === "famous-figures") return "Famous Figures";
  if (slug === "historical-photos") return "Historical Pics";
  if (slug === "landmarks") return "Landmarks";
  if (slug === "neighborhood-archive") return "Neighborhood Archive";
  if (slug === "hero-pics") return "Hero Pics";

  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function driveCaption(fileName: string) {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getDriveGalleryCollections(): Promise<GalleryCollectionDto[]> {
  const rootItems = await listGoogleDriveFolder();
  const folders = rootItems.filter((item) => item.type === "folder");
  const collections = await Promise.all(
    folders.map(async (folder, index) => {
      const images = (await listGoogleDriveFolder(folder.id))
        .filter((item) => item.type === "image" && item.thumbnailUrl)
        .map((item) => {
          const caption = driveCaption(item.name);
          return {
            src: item.thumbnailUrl ?? "",
            alt: caption || item.name,
            caption: caption || item.name,
          };
        });

      return {
        id: `drive-${folder.id}`,
        title: driveCollectionTitle(folder.name),
        slug: canonicalGallerySlug(folder.name) || "drive-folder",
        description: `Google Drive folder: ${folder.name}`,
        sortOrder: index + 1,
        images,
      };
    }),
  );

  return collections.filter((collection) => publicGallerySlugs.has(collection.slug));
}

export async function getDriveNeighborhoodArchiveItems(): Promise<NeighborhoodArchiveItem[]> {
  const rootItems = await listGoogleDriveFolder();
  const folder = rootItems.find((item) => item.type === "folder" && canonicalGallerySlug(item.name) === "neighborhood-archive");
  if (!folder) return [];

  const items = await listGoogleDriveFolder(folder.id);
  return items
    .filter((item) => (item.type === "image" || item.type === "video") && (item.thumbnailUrl || item.url))
    .map((item) => {
      const name = driveCaption(item.name) || item.name;
      return {
        id: `drive-${item.id}`,
        name,
        text: name,
        mediaType: item.type === "video" ? "VIDEO" : "IMAGE",
        src: item.type === "video" ? (item.url ?? "") : (item.thumbnailUrl ?? item.url ?? ""),
        thumbnail: item.thumbnailUrl,
        folder: folder.name,
      };
    });
}

export async function syncDriveGalleryToDatabase(prisma: PrismaClient) {
  const rootItems = await listGoogleDriveFolder();
  const folders = rootItems.filter((item) => item.type === "folder");
  const folderImages = await Promise.all(
    folders.map(async (folder) => ({
      folder,
      images: (await listGoogleDriveFolder(folder.id)).filter((item) => (item.type === "image" || item.type === "video") && (item.thumbnailUrl || item.url)),
    })),
  );

  return prisma.$transaction(async (tx) => {
    const collections = await Promise.all(
      folderImages.map(async ({ folder }, folderIndex) => {
        const slug = canonicalGallerySlug(folder.name) || "drive-folder";
        const title = driveCollectionTitle(folder.name);
        const collection = await tx.galleryCollection.upsert({
          where: { locale_slug: { locale: Locale.EN, slug } },
          update: {
            title,
            description: `Google Drive folder: ${folder.name}`,
            sortOrder: folderIndex + 1,
            status: PublishState.PUBLISHED,
          },
          create: {
            locale: Locale.EN,
            slug,
            title,
            description: `Google Drive folder: ${folder.name}`,
            sortOrder: folderIndex + 1,
            status: PublishState.PUBLISHED,
          },
        });
        return { collection, folder, images: folderImages[folderIndex].images };
      }),
    );

    const allDriveImages = collections.flatMap(({ folder, images }) => images.map((image) => ({ folder, image })));
    const allDriveFileIds = [...new Set(allDriveImages.map(({ image }) => image.id))];
    const existingAssets = await tx.mediaAsset.findMany({
      where: { publicId: { in: allDriveFileIds } },
      select: { id: true, publicId: true },
    });
    const existingAssetIds = new Set(existingAssets.map((asset) => asset.publicId).filter(Boolean));
    const assetsToCreate = allDriveImages
      .filter(({ image }) => !existingAssetIds.has(image.id))
      .map(({ folder, image }) => {
        const caption = driveCaption(image.name);
        return {
          key: `google-drive-${image.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
          type: image.type === "video" ? MediaType.VIDEO : MediaType.IMAGE,
          url: image.type === "video" ? (image.url ?? "") : (image.thumbnailUrl ?? ""),
          secureUrl: image.type === "video" ? image.url : image.thumbnailUrl,
          publicId: image.id,
          alt: caption || image.name,
          caption: caption || image.name,
          source: "google drive",
          metadata: { driveFolderId: folder.id, driveFolderName: folder.name, originalName: image.name, thumbnailUrl: image.thumbnailUrl },
        };
      });

    if (assetsToCreate.length > 0) {
      await tx.mediaAsset.createMany({
        data: assetsToCreate,
        skipDuplicates: true,
      });
    }

    const assets = await tx.mediaAsset.findMany({
      where: { publicId: { in: allDriveFileIds } },
      select: { id: true, publicId: true },
    });
    const assetByPublicId = new Map(assets.map((asset) => [asset.publicId, asset.id]));

    await Promise.all(
      collections.map(({ collection, images }) =>
        tx.galleryImage.deleteMany({
          where: {
            collectionId: collection.id,
            mediaAsset: {
              publicId: {
                notIn: images.map((image) => image.id),
              },
            },
          },
        }),
      ),
    );

    const existingGalleryImages = await tx.galleryImage.findMany({
      where: {
        collectionId: { in: collections.map(({ collection }) => collection.id) },
        mediaAssetId: { in: assets.map((asset) => asset.id) },
      },
      select: { collectionId: true, mediaAssetId: true },
    });
    const existingGalleryKeys = new Set(existingGalleryImages.map((image) => `${image.collectionId}:${image.mediaAssetId}`));

    const galleryImagesToCreate = collections.flatMap(({ collection, folder, images }) =>
      images.flatMap((image, imageIndex) => {
        const mediaAssetId = assetByPublicId.get(image.id);
        if (!mediaAssetId || existingGalleryKeys.has(`${collection.id}:${mediaAssetId}`)) return [];
        const caption = driveCaption(image.name);
        return [
          {
            collectionId: collection.id,
            mediaAssetId,
            alt: caption || image.name,
            caption: caption || image.name,
            sortOrder: imageIndex + 1,
            metadata: { driveFileId: image.id, driveFolderId: folder.id },
          },
        ];
      }),
    );

    if (galleryImagesToCreate.length > 0) {
      await tx.galleryImage.createMany({ data: galleryImagesToCreate });
    }

    return {
      folders: folders.length,
      images: collections.reduce((total, collection) => total + collection.images.length, 0),
    };
  }, { timeout: 60000 });
}
