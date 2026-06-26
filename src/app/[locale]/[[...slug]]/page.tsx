import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DynamicPage } from "@/components/cms/dynamic-page";
import { JoinUsPage } from "@/components/cms/join-us-page";
import { MergedWhoWeArePage } from "@/components/cms/merged-who-we-are-page";
import { getMembers, getPageBySlug } from "@/lib/cms-data";
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
  if (slug === "join-us") {
    const title = "Join L.O.R.A | Membership Application";
    const description = "Apply to join Luweibdeh Old Residents Association and support heritage preservation, cultural memory, and community life in Jabal Al-Luweibdeh.";
    const image = absoluteUrl(defaultOgImage);
    return {
      title,
      description,
      alternates: pageAlternates(locale, slug),
      openGraph: {
        title,
        description,
        url: pagePath(locale, slug),
        siteName,
        images: [{ url: image, width: 1200, height: 630, alt: "Join L.O.R.A" }],
        locale: locale === "ar" ? "ar_JO" : "en_US",
        alternateLocale: [locale === "ar" ? "en_US" : "ar_JO"],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  }

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
          width: 1200,
          height: 630,
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
  if (slug === "what-we-do" || slug === "founding-members") redirect(`/${locale}/who-we-are`);

  if (slug === "join-us") {
    return <JoinUsPage locale={locale} />;
  }

  const page = await getPageBySlug(locale, slug);

  if (!page) notFound();

  if (slug === "who-we-are") {
    const [whatPage, members] = await Promise.all([getPageBySlug(locale, "what-we-do"), getMembers(locale)]);
    return (
      <>
        <MergedWhoWeArePage locale={locale} whoPage={page} whatPage={whatPage} members={members} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd(page)) }} />
      </>
    );
  }

  return (
    <>
      <DynamicPage page={page} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd(page)) }} />
    </>
  );
}
