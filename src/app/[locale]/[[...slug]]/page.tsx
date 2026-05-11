import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DynamicPage } from "@/components/cms/dynamic-page";
import { getPageBySlug } from "@/lib/cms-data";
import { normalizeLocale, normalizeSlug } from "@/lib/cms-constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug: rawSlug } = await params;
  const locale = normalizeLocale(rawLocale);
  const slug = normalizeSlug(rawSlug);
  const page = await getPageBySlug(locale, slug);

  return {
    title: page?.seoTitle ?? page?.title ?? "LORA",
    description: page?.seoDescription ?? undefined,
    openGraph: {
      title: page?.seoTitle ?? page?.title ?? "LORA",
      description: page?.seoDescription ?? undefined,
      images: page?.seoImage ? [page.seoImage] : undefined,
      locale,
      type: "website",
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

  return <DynamicPage page={page} />;
}
