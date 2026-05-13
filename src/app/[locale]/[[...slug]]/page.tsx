import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DynamicPage } from "@/components/cms/dynamic-page";
import { getPageBySlug } from "@/lib/cms-data";
import { normalizeLocale, normalizeSlug } from "@/lib/cms-constants";
import { absoluteUrl, defaultOgImage, defaultSeoDescription, pageAlternates, pagePath, seoImage, siteName, webPageJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug: rawSlug } = await params;
  const locale = normalizeLocale(rawLocale);
  const slug = normalizeSlug(rawSlug);
  const page = await getPageBySlug(locale, slug);
  const title = page?.seoTitle ?? page?.title ?? siteName;
  const description = page?.seoDescription ?? defaultSeoDescription;
  const image = page ? seoImage(page) : defaultOgImage;

  return {
    title,
    description,
    alternates: pageAlternates(locale, slug),
    openGraph: {
      title,
      description,
      url: pagePath(locale, slug),
      siteName,
      images: [
        {
          url: absoluteUrl(image),
          alt: title,
        },
      ],
      locale: locale === "ar" ? "ar_JO" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_JO"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export default async function CmsRoute({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale: rawLocale, slug: rawSlug } = await params;
  const locale = normalizeLocale(rawLocale);
  const slug = normalizeSlug(rawSlug);
  const page = await getPageBySlug(locale, slug);

  if (!page) notFound();

  return (
    <>
      <DynamicPage page={page} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd(page)) }} />
    </>
  );
}
