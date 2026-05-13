import { notFound } from "next/navigation";
import { Locale, PublishState } from "@prisma/client";

import { PageSectionEditor } from "@/components/admin/page-section-editor";
import { listAdminMedia } from "@/lib/admin-data";
import { jsonInput } from "@/lib/api-utils";
import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";
import type { CmsPage } from "@/types/cms";

type PageLookup =
  | { id: string; slug?: never }
  | { slug: string; id?: never };

function fallbackPageForLookup(lookup: PageLookup) {
  return Object.values(fallbackPages)
    .flatMap((pages) => Object.values(pages))
    .find((page) => ("id" in lookup ? page.id === lookup.id : page.slug === lookup.slug));
}

async function createStarterPageFromFallback(page: CmsPage) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const locale = page.locale === "ar" ? Locale.AR : Locale.EN;

  return prisma.page.upsert({
    where: { locale_slug: { locale, slug: page.slug } },
    update: {},
    create: {
      locale,
      slug: page.slug,
      title: page.title,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoImage: page.seoImage,
      status: page.status as PublishState,
      publishedAt: page.status === "PUBLISHED" ? new Date() : null,
      sections: {
        create: page.sections.map((section) => ({
          type: section.type,
          variant: section.variant,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          content: jsonInput(section.content),
          settings: jsonInput(section.settings),
          spacing: section.spacing ? jsonInput(section.spacing) : undefined,
          background: section.background ? jsonInput(section.background) : undefined,
          alignment: section.alignment,
        })),
      },
    },
    include: { sections: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function AdminPageEditorLoader({ lookup }: { lookup: PageLookup }) {
  const prisma = getPrisma();

  if (prisma) {
    const mediaAssetsPromise = listAdminMedia();
    let page =
      "id" in lookup
        ? await prisma.page.findUnique({ where: { id: lookup.id }, include: { sections: { orderBy: { sortOrder: "asc" } } } })
        : await prisma.page.findFirst({ where: { locale: Locale.EN, slug: lookup.slug }, include: { sections: { orderBy: { sortOrder: "asc" } } } });

    if (!page && "slug" in lookup) {
      const fallback = fallbackPageForLookup(lookup);
      page = fallback ? await createStarterPageFromFallback(fallback) : null;
    }

    if (!page) notFound();
    const mediaAssets = await mediaAssetsPromise;

    return (
      <PageSectionEditor
        pageId={page.id}
        pageTitle={page.title}
        page={{
          id: page.id,
          locale: page.locale,
          title: page.title,
          slug: page.slug,
          status: page.status,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          seoImage: page.seoImage,
        }}
        sections={page.sections}
        mediaAssets={mediaAssets}
      />
    );
  }

  const page = fallbackPageForLookup(lookup);
  if (!page) notFound();

  return <PageSectionEditor pageId={page.id} pageTitle={page.title} page={page} sections={page.sections} mediaAssets={[]} />;
}
