import { Locale, MediaType, PublishState, type PrismaClient } from "@prisma/client";

import { DRIVE_FOLDER_REGISTRY } from "@/lib/drive-folders";
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
  const collections = await Promise.all(
    Object.entries(DRIVE_FOLDER_REGISTRY)
      .filter(([slug]) => publicGallerySlugs.has(slug))
      .map(async ([slug, folderId], index) => {
        const images = (await listGoogleDriveFolder(folderId))
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
          id: `drive-${folderId}`,
          title: driveCollectionTitle(slug),
          slug,
          description: `Google Drive folder: ${slug}`,
          sortOrder: index + 1,
          images,
        };
      }),
  );

  return collections.filter((collection) => publicGallerySlugs.has(collection.slug));
}

export async function getDriveNeighborhoodArchiveItems(): Promise<NeighborhoodArchiveItem[]> {
  const folderId = DRIVE_FOLDER_REGISTRY["neighborhood-archive"];
  if (!folderId) return [];

  const items = await listGoogleDriveFolder(folderId);
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
        folder: "neighborhood-archive",
      };
    });
}

function mediaAssetInput(folderId: string, image: Awaited<ReturnType<typeof listGoogleDriveFolder>>[number], folderName?: string) {
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
    metadata: { driveFolderId: folderId, driveFolderName: folderName ?? null, originalName: image.name, thumbnailUrl: image.thumbnailUrl },
  };
}

export async function syncSingleFolderToDatabase(
  prisma: PrismaClient,
  folderId: string,
): Promise<{ images: number }> {
  const images = (await listGoogleDriveFolder(folderId)).filter((item) => (item.type === "image" || item.type === "video") && (item.thumbnailUrl || item.url));

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      images.map((image) => {
        const input = mediaAssetInput(folderId, image);
        return tx.mediaAsset.upsert({
          where: { key: input.key },
          update: {
            type: input.type,
            url: input.url,
            secureUrl: input.secureUrl,
            publicId: input.publicId,
            alt: input.alt,
            caption: input.caption,
            source: input.source,
            metadata: input.metadata,
          },
          create: input,
        });
      }),
    );
  }, { timeout: 60000 });

  return { images: images.length };
}

export async function syncDriveGalleryToDatabase(prisma: PrismaClient) {
  const rootItems = await listGoogleDriveFolder();
  const rootFolders = rootItems.filter((item) => item.type === "folder");
  const existingCollections = await prisma.galleryCollection.findMany({ where: { locale: Locale.EN } });
  const existingCollectionBySlug = new Map(existingCollections.map((collection) => [collection.slug, collection]));
  const targetBySlug = new Map<string, { slug: string; title: string; folderId: string; folderName: string; sortOrder: number }>();

  for (const [index, [slug, folderId]] of Object.entries(DRIVE_FOLDER_REGISTRY).entries()) {
    targetBySlug.set(slug, {
      slug,
      title: driveCollectionTitle(slug),
      folderId,
      folderName: slug,
      sortOrder: index + 1,
    });
  }

  for (const collection of existingCollections) {
    const folderId = collection.driveFolderId ?? DRIVE_FOLDER_REGISTRY[collection.slug];
    if (!folderId) continue;
    targetBySlug.set(collection.slug, {
      slug: collection.slug,
      title: collection.title || driveCollectionTitle(collection.slug),
      folderId,
      folderName: collection.slug,
      sortOrder: collection.sortOrder,
    });
  }

  for (const [index, folder] of rootFolders.entries()) {
    const slug = canonicalGallerySlug(folder.name) || `drive-folder-${index + 1}`;
    if (targetBySlug.has(slug)) continue;
    const existingCollection = existingCollectionBySlug.get(slug);
    targetBySlug.set(slug, {
      slug,
      title: existingCollection?.title || driveCollectionTitle(folder.name),
      folderId: folder.id,
      folderName: folder.name,
      sortOrder: existingCollection?.sortOrder ?? targetBySlug.size + 1,
    });
  }

  const targets = [...targetBySlug.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  const folderImages = await Promise.all(
    targets.map(async (target) => ({
      target,
      images: (await listGoogleDriveFolder(target.folderId)).filter((item) => (item.type === "image" || item.type === "video") && (item.thumbnailUrl || item.url)),
    })),
  );

  return prisma.$transaction(async (tx) => {
    const collections = await Promise.all(
      folderImages.map(async ({ target }, folderIndex) => {
        const collection = await tx.galleryCollection.upsert({
          where: { locale_slug: { locale: Locale.EN, slug: target.slug } },
          update: {
            title: target.title,
            description: `Google Drive folder: ${target.folderName}`,
            driveFolderId: target.folderId,
            sortOrder: folderIndex + 1,
            status: PublishState.PUBLISHED,
          },
          create: {
            locale: Locale.EN,
            slug: target.slug,
            title: target.title,
            description: `Google Drive folder: ${target.folderName}`,
            driveFolderId: target.folderId,
            sortOrder: folderIndex + 1,
            status: PublishState.PUBLISHED,
          },
        });
        return { collection, target, images: folderImages[folderIndex].images };
      }),
    );

    const allDriveImages = collections.flatMap(({ target, images }) => images.map((image) => ({ target, image })));
    const allDriveFileIds = [...new Set(allDriveImages.map(({ image }) => image.id))];
    const existingAssets = await tx.mediaAsset.findMany({
      where: { publicId: { in: allDriveFileIds } },
      select: { id: true, publicId: true },
    });
    const existingAssetIds = new Set(existingAssets.map((asset) => asset.publicId).filter(Boolean));
    const assetsToCreate = allDriveImages
      .filter(({ image }) => !existingAssetIds.has(image.id))
      .map(({ target, image }) => mediaAssetInput(target.folderId, image, target.folderName));

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

    const galleryImagesToCreate = collections.flatMap(({ collection, target, images }) =>
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
            metadata: { driveFileId: image.id, driveFolderId: target.folderId },
          },
        ];
      }),
    );

    if (galleryImagesToCreate.length > 0) {
      await tx.galleryImage.createMany({ data: galleryImagesToCreate });
    }

    return {
      folders: targets.length,
      images: collections.reduce((total, collection) => total + collection.images.length, 0),
    };
  }, { timeout: 60000 });
}
