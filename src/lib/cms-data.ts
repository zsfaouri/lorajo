import { Locale, PublishState } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";

import {
  fallbackFooter,
  fallbackGallery,
  fallbackMembers,
  fallbackNavigation,
  fallbackPages,
  fallbackTheme,
} from "@/lib/fallback-data";
import { listGoogleDriveFolder } from "@/lib/google-drive";
import { getPrisma } from "@/lib/prisma";
import { isRecord } from "@/lib/utils";
import type {
  CmsPage,
  EventDto,
  FooterColumnDto,
  GalleryCollectionDto,
  LocaleCode,
  MemberDto,
  NavigationItemDto,
  ThemeTokens,
} from "@/types/cms";

function toPrismaLocale(locale: LocaleCode) {
  return locale === "ar" ? Locale.AR : Locale.EN;
}

function toLocaleCode(locale: Locale): LocaleCode {
  return locale === Locale.AR ? "ar" : "en";
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function slugifyDriveName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function driveCollectionTitle(name: string) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function driveCaption(fileName: string) {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalDriveSlug(name: string) {
  const slug = slugifyDriveName(name);
  if (["famous", "famous-figures", "famous-figuers"].includes(slug)) return "famous-figures";
  if (["historical-pics", "historical-photos", "history"].includes(slug)) return "historical-photos";
  if (["founders", "founding-members"].includes(slug)) return "founding-members";
  if (["hero", "hero-pics", "hero-pictures"].includes(slug)) return "hero-pics";
  return slug || "drive-folder";
}

async function getDriveGalleryCollections(): Promise<GalleryCollectionDto[]> {
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

  return collections.filter((collection) => collection.images.length > 0);
}

export async function getActiveTheme(): Promise<ThemeTokens> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return fallbackTheme;

  try {
    const theme = await prisma.siteTheme.findFirst({ where: { isActive: true } });
    return isRecord(theme?.tokens) ? (theme.tokens as ThemeTokens) : fallbackTheme;
  } catch {
    return fallbackTheme;
  }
}

export async function getNavigation(locale: LocaleCode): Promise<NavigationItemDto[]> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return fallbackNavigation[locale];

  try {
    const items = await prisma.navigationItem.findMany({
      where: { locale: toPrismaLocale(locale), isVisible: true },
      orderBy: { sortOrder: "asc" },
    });

    return items.map((item) => ({
      id: item.id,
      label: item.label,
      path: item.path,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
    }));
  } catch {
    return fallbackNavigation[locale];
  }
}

export async function getFooter(locale: LocaleCode): Promise<FooterColumnDto[]> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return fallbackFooter[locale];

  try {
    const columns = await prisma.footerColumn.findMany({
      where: { locale: toPrismaLocale(locale) },
      orderBy: { sortOrder: "asc" },
    });

    return columns.map((column) => ({
      id: column.id,
      title: column.title,
      sortOrder: column.sortOrder,
      content: asRecord(column.content),
      links: Array.isArray(column.links) ? (column.links as FooterColumnDto["links"]) : [],
    }));
  } catch {
    return fallbackFooter[locale];
  }
}

export async function getMembers(locale: LocaleCode): Promise<MemberDto[]> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return fallbackMembers;

  try {
    const members = await prisma.member.findMany({
      where: {
        locale: toPrismaLocale(locale),
        isFounder: true,
        status: PublishState.PUBLISHED,
      },
      include: { mediaAsset: true },
      orderBy: { sortOrder: "asc" },
    });

    return members.map((member) => ({
      id: member.id,
      name: member.name,
      slug: member.slug,
      title: member.title,
      sortOrder: member.sortOrder,
      image: member.mediaAsset
        ? {
            src: member.mediaAsset.url,
            alt: member.mediaAsset.alt ?? member.name,
            caption: member.mediaAsset.caption ?? undefined,
          }
        : null,
    }));
  } catch {
    return fallbackMembers;
  }
}

export async function getEvents(locale: LocaleCode): Promise<EventDto[]> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const events = await prisma.event.findMany({
      where: { locale: toPrismaLocale(locale), status: PublishState.PUBLISHED },
      include: { mediaAsset: true },
      orderBy: { startsAt: "asc" },
    });

    return events.map((event) => {
      const content = asRecord(event.content);
      const imageUrl = typeof content.imageUrl === "string" ? content.imageUrl : null;
      const imageAlt = typeof content.imageAlt === "string" ? content.imageAlt : event.title;

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        summary: event.summary,
        body: typeof content.body === "string" ? content.body : null,
        startsAt: event.startsAt?.toISOString() ?? null,
        endsAt: event.endsAt?.toISOString() ?? null,
        location: event.location,
        actionLabel: typeof content.actionLabel === "string" ? content.actionLabel : null,
        image: event.mediaAsset
          ? {
              src: event.mediaAsset.url,
              alt: event.mediaAsset.alt ?? event.title,
              caption: event.mediaAsset.caption ?? undefined,
            }
          : imageUrl
            ? {
                src: imageUrl,
                alt: imageAlt,
              }
            : null,
      };
    });
  } catch {
    return [];
  }
}

export async function getGalleryCollections(locale: LocaleCode): Promise<GalleryCollectionDto[]> {
  noStore();
  const driveCollections = await getDriveGalleryCollections().catch(() => []);
  if (driveCollections.length > 0) return driveCollections;

  const prisma = getPrisma();
  if (!prisma) return fallbackGallery;

  try {
    const collections = await prisma.galleryCollection.findMany({
      where: { locale: toPrismaLocale(locale), status: PublishState.PUBLISHED },
      include: {
        images: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      description: collection.description,
      sortOrder: collection.sortOrder,
      images: collection.images.map((image) => ({
        src: image.mediaAsset.url,
        alt: image.alt,
        caption: image.caption ?? image.mediaAsset.caption ?? undefined,
      })),
    }));
  } catch {
    return fallbackGallery;
  }
}

export async function getPageBySlug(locale: LocaleCode, slug: string): Promise<CmsPage | null> {
  noStore();
  const fallback = fallbackPages[locale]?.[slug] ?? fallbackPages[locale]?.home ?? null;
  const prisma = getPrisma();
  if (!prisma) return fallback;

  try {
    const page = await prisma.page.findUnique({
      where: { locale_slug: { locale: toPrismaLocale(locale), slug } },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page || page.status !== PublishState.PUBLISHED) return fallback;

    return {
      id: page.id,
      locale: toLocaleCode(page.locale),
      slug: page.slug,
      title: page.title,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoImage: page.seoImage,
      status: page.status,
      sections: page.sections.map((section) => ({
        id: section.id,
        type: section.type,
        variant: section.variant,
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
        content: asRecord(section.content),
        settings: asRecord(section.settings),
        spacing: asRecord(section.spacing),
        background: asRecord(section.background),
        alignment: section.alignment,
      })),
    };
  } catch {
    return fallback;
  }
}

export async function getPagesForAdmin() {
  noStore();
  const prisma = getPrisma();
  if (!prisma) {
    return Object.values(fallbackPages.en).map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      locale: page.locale,
      status: page.status,
      sections: page.sections.length,
    }));
  }

  try {
    const pages = await prisma.page.findMany({
      include: { _count: { select: { sections: true } } },
      orderBy: [{ locale: "asc" }, { slug: "asc" }],
    });

    return pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      locale: toLocaleCode(page.locale),
      status: page.status,
      sections: page._count.sections,
    }));
  } catch {
    return [];
  }
}
