import { Locale, MediaType, PublishState } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";

import {
  fallbackFooter,
  fallbackGallery,
  fallbackMembers,
  fallbackNavigation,
  fallbackNeighborhoodArchive,
  fallbackPages,
  fallbackTheme,
} from "@/lib/fallback-data";
import { getDriveGalleryCollections, getDriveNeighborhoodArchiveItems } from "@/lib/drive-gallery";
import { getPrisma } from "@/lib/prisma";
import { isRecord } from "@/lib/utils";
import type {
  CmsPage,
  EventDto,
  ArticleDto,
  FooterColumnDto,
  GalleryCollectionDto,
  LocaleCode,
  MemberDto,
  NeighborhoodArchiveItem,
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

function galleryTitleForSlug(slug: string, title: string) {
  if (slug === "famous-figures") return "Famous Figures";
  if (slug === "historical-photos") return "Historical Pics";
  if (slug === "landmarks") return "Landmarks";
  return title;
}

const publicGallerySlugs = ["famous-figures", "historical-photos", "landmarks"];

function defaultNavigationItem(locale: LocaleCode): NavigationItemDto {
  return locale === "ar"
    ? { id: "nav-ar-neighborhood-archive", label: "أرشيف الحي", path: "/ar/neighborhood-archive", sortOrder: 5, isVisible: true }
    : { id: "nav-en-neighborhood-archive", label: "NEIGHBORHOOD ARCHIVE", path: "/en/neighborhood-archive", sortOrder: 5, isVisible: true };
}

function withDefaultNavigation(locale: LocaleCode, items: NavigationItemDto[]) {
  const archivePath = `/${locale}/neighborhood-archive`;
  if (items.some((item) => item.path === archivePath || item.label.toLowerCase() === "neighborhood archive")) return items;
  return [...items, defaultNavigationItem(locale)].sort((a, b) => a.sortOrder - b.sortOrder);
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
  if (!prisma) return withDefaultNavigation(locale, fallbackNavigation[locale]);

  try {
    const items = await prisma.navigationItem.findMany({
      where: { locale: toPrismaLocale(locale), isVisible: true },
      orderBy: { sortOrder: "asc" },
    });

    return withDefaultNavigation(locale, items.map((item) => ({
      id: item.id,
      label: item.label,
      path: item.path,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
    })));
  } catch {
    return withDefaultNavigation(locale, fallbackNavigation[locale]);
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
        invitationUrl: typeof content.invitationUrl === "string" ? content.invitationUrl : null,
        videoUrl: typeof content.videoUrl === "string" ? content.videoUrl : null,
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

export async function getArticles(locale: LocaleCode): Promise<ArticleDto[]> {
  noStore();
  const prisma = getPrisma();
  if (!prisma) return [];

  try {
    const articles = await prisma.article.findMany({
      where: { locale: toPrismaLocale(locale), status: PublishState.PUBLISHED },
      include: { mediaAsset: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return articles.map((article) => {
      const content = asRecord(article.content);
      const imageUrl = typeof content.imageUrl === "string" ? content.imageUrl : null;
      const imageAlt = typeof content.imageAlt === "string" ? content.imageAlt : article.title;
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        body: typeof content.body === "string" ? content.body : null,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        image: article.mediaAsset
          ? {
              src: article.mediaAsset.url,
              alt: article.mediaAsset.alt ?? article.title,
              caption: article.mediaAsset.caption ?? undefined,
            }
          : imageUrl
            ? { src: imageUrl, alt: imageAlt }
            : null,
      };
    });
  } catch {
    return [];
  }
}

export async function getGalleryCollections(locale: LocaleCode): Promise<GalleryCollectionDto[]> {
  noStore();
  const prisma = getPrisma();

  async function driveFallback() {
    const driveCollections = await getDriveGalleryCollections().catch(() => []);
    return driveCollections.length > 0 ? driveCollections : fallbackGallery;
  }

  if (!prisma) return driveFallback();

  try {
    const collections = await prisma.galleryCollection.findMany({
      where: { locale: toPrismaLocale(locale), status: PublishState.PUBLISHED, slug: { in: publicGallerySlugs } },
      include: {
        images: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const databaseCollections = collections.map((collection) => ({
      id: collection.id,
      title: galleryTitleForSlug(collection.slug, collection.title),
      slug: collection.slug,
      description: collection.description,
      sortOrder: collection.sortOrder,
      images: collection.images.map((image) => ({
        src: image.mediaAsset.url,
        alt: image.alt,
        caption: image.caption ?? image.mediaAsset.caption ?? undefined,
      })),
    }));

    if (databaseCollections.length > 0) return databaseCollections;
    return driveFallback();
  } catch {
    return fallbackGallery;
  }
}

export async function getNeighborhoodArchiveItems(locale: LocaleCode): Promise<NeighborhoodArchiveItem[]> {
  noStore();
  const prisma = getPrisma();
  const driveItems = await getDriveNeighborhoodArchiveItems().catch(() => []);
  if (!prisma) return driveItems.length > 0 ? driveItems : fallbackNeighborhoodArchive;

  try {
    const collection = await prisma.galleryCollection.findUnique({
      where: { locale_slug: { locale: toPrismaLocale(locale), slug: "neighborhood-archive" } },
      include: {
        images: {
          include: { mediaAsset: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const databaseItems =
      collection?.images.map((item) => {
        const metadata = asRecord(item.mediaAsset.metadata);
        const thumbnail = typeof metadata.thumbnailUrl === "string" ? metadata.thumbnailUrl : item.mediaAsset.publicId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.mediaAsset.publicId)}&sz=w2000` : null;
        return {
          id: item.id,
          name: item.alt || item.mediaAsset.alt || "Archive item",
          text: item.caption ?? item.mediaAsset.caption ?? null,
          mediaType: item.mediaAsset.type === MediaType.VIDEO ? "VIDEO" : "IMAGE",
          src: item.mediaAsset.url,
          thumbnail,
          folder: typeof metadata.driveFolderName === "string" ? metadata.driveFolderName : collection.title,
        } satisfies NeighborhoodArchiveItem;
      }) ?? [];

    return databaseItems.length > 0 ? databaseItems : driveItems.length > 0 ? driveItems : fallbackNeighborhoodArchive;
  } catch {
    return driveItems.length > 0 ? driveItems : fallbackNeighborhoodArchive;
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
