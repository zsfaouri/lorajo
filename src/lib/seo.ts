import { PublishState } from "@prisma/client";

import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";
import type { CmsPage, LocaleCode } from "@/types/cms";

export const siteName = "L.O.R.A";
export const organizationName = "Luweibdeh Old Residents Association";
export const defaultSeoTitle = "L.O.R.A | Luweibdeh Old Residents Association";
export const defaultSeoDescription =
  "L.O.R.A preserves Jabal Al-Luweibdeh's heritage architecture, greenery, cultural memory, and community life in Amman, Jordan.";
export const defaultOgImage = "/lora/gallery/square-de-paris.jpg";

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

export function pageTypeForSlug(slug: string) {
  if (slug === "photo-gallery" || slug === "neighborhood-archive") return "CollectionPage";
  if (slug === "join-us") return "ContactPage";
  return "WebPage";
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
    "@type": ["NGO", "LocalBusiness"],
    "@id": `${base}/#organization`,
    name: organizationName,
    alternateName: ["L.O.R.A", "LORA", "Luweibdeh Old Residents Association"],
    url: base,
    logo: absoluteUrl("/lora/brand/lora-logo.png"),
    image: absoluteUrl(defaultOgImage),
    description: defaultSeoDescription,
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Amman",
      addressRegion: "Jabal Al-Luweibdeh",
      addressCountry: "JO",
    },
    areaServed: [
      {
        "@type": "Place",
        name: "Jabal Al-Luweibdeh, Amman",
      },
    ],
    knowsAbout: [
      "Jabal Al-Luweibdeh heritage",
      "Amman cultural heritage",
      "historic preservation",
      "community initiatives",
      "neighborhood archive",
    ],
    email: "info@lorajo.org",
    telephone: "+962779306500",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: siteName,
    alternateName: organizationName,
    url: siteUrl(),
    publisher: {
      "@id": `${siteUrl()}/#organization`,
    },
    inLanguage: ["en", "ar"],
  };
}

export function webPageJsonLd(page: CmsPage) {
  const image = absoluteUrl(seoImage(page));
  return {
    "@context": "https://schema.org",
    "@type": pageTypeForSlug(page.slug),
    "@id": `${pageUrl(page.locale, page.slug)}#webpage`,
    name: page.seoTitle || page.title,
    description: page.seoDescription || defaultSeoDescription,
    url: pageUrl(page.locale, page.slug),
    isPartOf: {
      "@id": `${siteUrl()}/#website`,
    },
    publisher: {
      "@id": `${siteUrl()}/#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: image,
    },
    image,
    about: {
      "@id": `${siteUrl()}/#organization`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: pageUrl(page.locale, "home"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.title,
          item: pageUrl(page.locale, page.slug),
        },
      ],
    },
    inLanguage: page.locale,
  };
}

export async function getPublishedPagesForSeo(): Promise<SeoPage[]> {
  const fallbackSeoPages = () => Object.values(fallbackPages).flatMap((pages) => Object.values(pages).map((page) => ({ ...page })));
  const prisma = getPrisma();
  if (!prisma) {
    return fallbackSeoPages();
  }

  try {
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
  } catch {
    return fallbackSeoPages();
  }
}
