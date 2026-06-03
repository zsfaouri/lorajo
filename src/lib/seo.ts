import { PublishState } from "@prisma/client";

import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";
import type { CmsPage, LocaleCode } from "@/types/cms";

export const siteName = "LORA";
export const organizationName = "Luweibdeh Old Residents Association";
export const defaultSeoTitle = "LORA - Luweibdeh Old Residents Association";
export const defaultSeoDescription =
  "LORA preserves Jabal Al-Luweibdeh's historical architecture, greenery, cultural heritage, and community life in Amman.";
export const defaultOgImage = "/lora/brand/lora-logo.png";

type SeoPage = {
  locale: LocaleCode;
  slug: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  updatedAt?: Date;
};

function cleanUrl(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/\/+$/, "");
}

export function siteUrl() {
  return cleanUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "https://lorajo.org");
}

export function pagePath(locale: LocaleCode, slug: string) {
  return slug === "home" ? `/${locale}` : `/${locale}/${slug}`;
}

export function absoluteUrl(path: string) {
  const cleanPath = path.trim();
  if (/^https?:\/\//i.test(cleanPath)) return cleanUrl(cleanPath);
  return `${siteUrl()}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
}

export function pageUrl(locale: LocaleCode, slug: string) {
  return absoluteUrl(pagePath(locale, slug));
}

export function firstImageFromPage(page: CmsPage) {
  for (const section of page.sections) {
    const image = section.content.image;
    if (typeof image === "string" && image) return image;

    const frames = section.settings.heroScrubFrames;
    if (Array.isArray(frames)) {
      const frame = frames.find((item): item is string => typeof item === "string" && item.length > 0);
      if (frame) return frame;
    }

    for (const key of ["items", "images"]) {
      const items = section.content[key];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item && typeof item === "object" && "src" in item && typeof item.src === "string" && item.src) {
          return item.src;
        }
      }
    }
  }
  return defaultOgImage;
}

export function seoImage(page: CmsPage) {
  return page.seoImage || firstImageFromPage(page) || defaultOgImage;
}

export function pageAlternates(locale: LocaleCode, slug: string) {
  return {
    canonical: pageUrl(locale, slug),
    languages: {
      en: pageUrl("en", slug),
      ar: pageUrl("ar", slug),
      "x-default": pageUrl("en", slug),
    },
  };
}

export function organizationJsonLd() {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: organizationName,
    alternateName: siteName,
    url: base,
    logo: absoluteUrl(defaultOgImage),
    description: defaultSeoDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Amman",
      addressRegion: "Jabal Al-Luweibdeh",
      addressCountry: "JO",
    },
    email: "info@lorajo.org",
    telephone: "+962779306500",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: organizationName,
    url: siteUrl(),
    inLanguage: ["en", "ar"],
  };
}

export function webPageJsonLd(page: CmsPage) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.seoTitle || page.title,
    description: page.seoDescription || defaultSeoDescription,
    url: pageUrl(page.locale, page.slug),
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: siteUrl(),
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl(seoImage(page)),
    },
    inLanguage: page.locale,
  };
}

export async function getPublishedPagesForSeo(): Promise<SeoPage[]> {
  const prisma = getPrisma();
  if (!prisma) {
    return Object.values(fallbackPages).flatMap((pages) => Object.values(pages).map((page) => ({ ...page })));
  }

  const pages = await prisma.page.findMany({
    where: { status: PublishState.PUBLISHED },
    select: {
      locale: true,
      slug: true,
      title: true,
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
      updatedAt: true,
    },
    orderBy: [{ locale: "asc" }, { slug: "asc" }],
  });

  return pages.map((page) => ({
    locale: page.locale === "AR" ? "ar" : "en",
    slug: page.slug,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoImage: page.seoImage,
    updatedAt: page.updatedAt,
  }));
}
