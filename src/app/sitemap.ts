import type { MetadataRoute } from "next";

import { getPublishedPagesForSeo, pageUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function priorityForSlug(slug: string) {
  if (slug === "home") return 1;
  if (slug === "who-we-are" || slug === "what-we-do") return 0.9;
  if (slug === "founding-members" || slug === "photo-gallery") return 0.8;
  return 0.7;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getPublishedPagesForSeo();
  const publicPages = pages.map((page) => ({
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

  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicPages,
  ];
}
