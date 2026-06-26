import type { MetadataRoute } from "next";

import { getPublishedPagesForSeo, pageUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function priorityForSlug(slug: string) {
  if (slug === "home") return 1;
  if (slug === "who-we-are") return 0.95;
  if (slug === "photo-gallery" || slug === "neighborhood-archive") return 0.85;
  if (slug === "join-us") return 0.75;
  return 0.7;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getPublishedPagesForSeo();
  const redirectedSlugs = new Set(["what-we-do", "founding-members"]);
  const indexedPages = pages.filter((page) => !redirectedSlugs.has(page.slug));
  const hasJoinUs = indexedPages.some((page) => page.slug === "join-us");
  const publicPages = indexedPages.map((page) => ({
    url: pageUrl(page.locale, page.slug),
    lastModified: "updatedAt" in page && page.updatedAt instanceof Date ? page.updatedAt : new Date(),
    changeFrequency: page.slug === "home" ? ("weekly" as const) : ("monthly" as const),
    priority: priorityForSlug(page.slug),
    alternates: {
      languages: {
        en: pageUrl("en", page.slug),
        ar: pageUrl("ar", page.slug),
      },
    },
  }));
  const joinUsPages = hasJoinUs
    ? []
    : (["en", "ar"] as const).map((locale) => ({
        url: pageUrl(locale, "join-us"),
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: priorityForSlug("join-us"),
        alternates: {
          languages: {
            en: pageUrl("en", "join-us"),
            ar: pageUrl("ar", "join-us"),
          },
        },
      }));

  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicPages,
    ...joinUsPages,
  ];
}
