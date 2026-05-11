import { mkdir, readdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";

import { Locale, MediaType, PrismaClient, PublishState } from "@prisma/client";

const prisma = new PrismaClient();

const projectRoot = process.cwd();
const driveRoot = path.join(projectRoot, "FINAL PIC");
const archiveSource = path.join(driveRoot, "drive-download-20250924T090235Z-1-001");
const peopleSource = path.join(driveRoot, "PEOPLE");
const publicRoot = path.join(projectRoot, "public", "lora", "drive");

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

type SourceImage = {
  sourcePath: string;
  originalName: string;
  caption: string;
  category: "historical-photos" | "landmarks" | "famous-figures";
};

const collectionMeta = {
  "historical-photos": {
    sortOrder: 1,
    en: {
      title: "HISTORICAL PHOTOS",
      description: "Archival views and memory fragments from Jabal Al-Luweibdeh.",
    },
    ar: {
      title: "صور تاريخية",
      description: "مشاهد أرشيفية وذاكرة بصرية من جبل اللويبدة.",
    },
  },
  landmarks: {
    sortOrder: 2,
    en: {
      title: "LANDMARKS",
      description: "Civic, cultural, and architectural landmarks in the neighborhood.",
    },
    ar: {
      title: "معالم",
      description: "معالم مدنية وثقافية ومعمارية في الحي.",
    },
  },
  "famous-figures": {
    sortOrder: 3,
    en: {
      title: "FAMOUS FIGURES",
      description: "Residents and public figures connected to Luweibdeh history.",
    },
    ar: {
      title: "شخصيات بارزة",
      description: "شخصيات وسكان ارتبطوا بتاريخ اللويبدة.",
    },
  },
} as const;

function extensionOf(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function stripExtension(fileName: string) {
  return fileName.slice(0, fileName.length - path.extname(fileName).length);
}

function captionFromFileName(fileName: string) {
  return stripExtension(fileName)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bFLLOWER\b/gi, "Flower")
    .replace(/\bLUWEIBDEH\b/g, "Luweibdeh")
    .trim();
}

function isHistoricalFile(fileName: string) {
  return /^\d+$/i.test(stripExtension(fileName));
}

async function collectImages() {
  const images: SourceImage[] = [];
  const archiveFiles = await readdir(archiveSource);
  const peopleFiles = await readdir(peopleSource);

  for (const fileName of archiveFiles.sort(new Intl.Collator("en", { numeric: true }).compare)) {
    if (!imageExtensions.has(extensionOf(fileName))) continue;
    images.push({
      sourcePath: path.join(archiveSource, fileName),
      originalName: fileName,
      caption: captionFromFileName(fileName),
      category: isHistoricalFile(fileName) ? "historical-photos" : "landmarks",
    });
  }

  for (const fileName of peopleFiles.sort(new Intl.Collator("en", { numeric: true }).compare)) {
    if (!imageExtensions.has(extensionOf(fileName))) continue;
    images.push({
      sourcePath: path.join(peopleSource, fileName),
      originalName: fileName,
      caption: captionFromFileName(fileName),
      category: "famous-figures",
    });
  }

  return images;
}

function publicFileName(category: SourceImage["category"], index: number, originalName: string) {
  const ext = extensionOf(originalName) || ".jpg";
  return `${category}-${String(index + 1).padStart(3, "0")}${ext}`;
}

async function upsertCollection(locale: Locale, slug: SourceImage["category"]) {
  const meta = collectionMeta[slug];
  const localeMeta = locale === Locale.AR ? meta.ar : meta.en;

  return prisma.galleryCollection.upsert({
    where: { locale_slug: { locale, slug } },
    update: {
      title: localeMeta.title,
      description: localeMeta.description,
      sortOrder: meta.sortOrder,
      status: PublishState.PUBLISHED,
    },
    create: {
      locale,
      slug,
      title: localeMeta.title,
      description: localeMeta.description,
      sortOrder: meta.sortOrder,
      status: PublishState.PUBLISHED,
    },
  });
}

async function importCategory(category: SourceImage["category"], categoryImages: SourceImage[]) {
  const destinationDir = path.join(publicRoot, category);
  await mkdir(destinationDir, { recursive: true });

  const enCollection = await upsertCollection(Locale.EN, category);
  const arCollection = await upsertCollection(Locale.AR, category);

  await prisma.galleryImage.deleteMany({
    where: { collectionId: { in: [enCollection.id, arCollection.id] } },
  });

  for (const [index, image] of categoryImages.entries()) {
    const fileName = publicFileName(category, index, image.originalName);
    const destinationPath = path.join(destinationDir, fileName);
    await copyFile(image.sourcePath, destinationPath);
    const fileStats = await stat(destinationPath);
    const url = `/lora/drive/${category}/${fileName}`;
    const key = `drive-${category}-${String(index + 1).padStart(3, "0")}`;

    const mediaAsset = await prisma.mediaAsset.upsert({
      where: { key },
      update: {
        type: MediaType.IMAGE,
        url,
        alt: image.caption,
        caption: image.caption,
        bytes: fileStats.size,
        format: extensionOf(fileName).slice(1),
        source: "Google Drive import",
        metadata: {
          originalName: image.originalName,
          category,
        },
      },
      create: {
        key,
        type: MediaType.IMAGE,
        url,
        alt: image.caption,
        caption: image.caption,
        bytes: fileStats.size,
        format: extensionOf(fileName).slice(1),
        source: "Google Drive import",
        metadata: {
          originalName: image.originalName,
          category,
        },
      },
    });

    for (const collection of [enCollection, arCollection]) {
      await prisma.galleryImage.create({
        data: {
          collectionId: collection.id,
          mediaAssetId: mediaAsset.id,
          alt: image.caption,
          caption: image.caption,
          sortOrder: index + 1,
          metadata: {
            source: "Google Drive import",
            originalName: image.originalName,
          },
        },
      });
    }
  }
}

async function main() {
  const images = await collectImages();
  const grouped = {
    "historical-photos": images.filter((image) => image.category === "historical-photos"),
    landmarks: images.filter((image) => image.category === "landmarks"),
    "famous-figures": images.filter((image) => image.category === "famous-figures"),
  };

  for (const [category, categoryImages] of Object.entries(grouped)) {
    await importCategory(category as SourceImage["category"], categoryImages);
  }

  console.log(
    JSON.stringify({
      imported: images.length,
      historicalPhotos: grouped["historical-photos"].length,
      landmarks: grouped.landmarks.length,
      famousFigures: grouped["famous-figures"].length,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
