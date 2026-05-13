import { Locale, MediaType, PublishState, type PrismaClient } from "@prisma/client";

import { listGoogleDriveFolder } from "@/lib/google-drive";
import type { GalleryCollectionDto } from "@/types/cms";

function slugifyDriveName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function driveCollectionTitle(name: string) {
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

export function canonicalDriveSlug(name: string) {
  const slug = slugifyDriveName(name);
  if (["famous", "famous-figures", "famous-figuers"].includes(slug)) return "famous-figures";
  if (["historical-pics", "historical-photos", "history"].includes(slug)) return "historical-photos";
  if (["founders", "founding-members"].includes(slug)) return "founding-members";
  if (["hero", "hero-pics", "hero-pictures"].includes(slug)) return "hero-pics";
  return slug || "drive-folder";
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
        slug: canonicalDriveSlug(folder.name),
        description: `Google Drive folder: ${folder.name}`,
        sortOrder: index + 1,
        images,
      };
    }),
  );

  return collections.filter((collection) => collection.slug !== "hero-pics" && collection.images.length > 0);
}

export async function syncDriveGalleryToDatabase(prisma: PrismaClient) {
  const rootItems = await listGoogleDriveFolder();
  const folders = rootItems.filter((item) => item.type === "folder");
  const folderImages = await Promise.all(
    folders.map(async (folder) => ({
      folder,
      images: (await listGoogleDriveFolder(folder.id)).filter((item) => item.type === "image" && item.thumbnailUrl),
    })),
  );

  const collections = await Promise.all(
    folderImages.map(async ({ folder }, folderIndex) => {
      const slug = canonicalDriveSlug(folder.name);
      const title = driveCollectionTitle(folder.name);
      const collection = await prisma.galleryCollection.upsert({
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
  const existingAssets = await prisma.mediaAsset.findMany({
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
        type: MediaType.IMAGE,
        url: image.thumbnailUrl ?? "",
        secureUrl: image.thumbnailUrl,
        publicId: image.id,
        alt: caption || image.name,
        caption: caption || image.name,
        source: "google drive",
        metadata: { driveFolderId: folder.id, driveFolderName: folder.name, originalName: image.name },
      };
    });

  if (assetsToCreate.length > 0) {
    await prisma.mediaAsset.createMany({
      data: assetsToCreate,
      skipDuplicates: true,
    });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { publicId: { in: allDriveFileIds } },
    select: { id: true, publicId: true },
  });
  const assetByPublicId = new Map(assets.map((asset) => [asset.publicId, asset.id]));

  await Promise.all(
    collections.map(({ collection, images }) =>
      prisma.galleryImage.deleteMany({
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

  const existingGalleryImages = await prisma.galleryImage.findMany({
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
    await prisma.galleryImage.createMany({ data: galleryImagesToCreate });
  }

  return {
    folders: folders.length,
    images: collections.reduce((total, collection) => total + collection.images.length, 0),
  };
}
