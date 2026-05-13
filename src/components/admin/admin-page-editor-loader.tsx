import { notFound } from "next/navigation";

import { PageSectionEditor } from "@/components/admin/page-section-editor";
import { listAdminMedia } from "@/lib/admin-data";
import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

type PageLookup =
  | { id: string; slug?: never }
  | { slug: string; id?: never };

function fallbackPageForLookup(lookup: PageLookup) {
  return Object.values(fallbackPages)
    .flatMap((pages) => Object.values(pages))
    .find((page) => ("id" in lookup ? page.id === lookup.id : page.slug === lookup.slug));
}

export async function AdminPageEditorLoader({ lookup }: { lookup: PageLookup }) {
  const prisma = getPrisma();

  if (prisma) {
    const [page, mediaAssets] = await Promise.all([
      "id" in lookup
        ? prisma.page.findUnique({ where: { id: lookup.id }, include: { sections: { orderBy: { sortOrder: "asc" } } } })
        : prisma.page.findFirst({ where: { locale: "EN", slug: lookup.slug }, include: { sections: { orderBy: { sortOrder: "asc" } } } }),
      listAdminMedia(),
    ]);

    if (!page) notFound();

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
