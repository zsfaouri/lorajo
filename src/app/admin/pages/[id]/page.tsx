import { notFound } from "next/navigation";

import { PageSectionEditor } from "@/components/admin/page-section-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia } from "@/lib/admin-data";
import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

export default async function AdminPageEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const prisma = getPrisma();

  if (prisma) {
    const [page, mediaAssets] = await Promise.all([
      prisma.page.findUnique({ where: { id }, include: { sections: { orderBy: { sortOrder: "asc" } } } }),
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
        }}
        sections={page.sections}
        mediaAssets={mediaAssets}
      />
    );
  }

  const page = Object.values(fallbackPages)
    .flatMap((pages) => Object.values(pages))
    .find((item) => item.id === id);
  if (!page) notFound();

  return <PageSectionEditor pageId={page.id} pageTitle={page.title} page={page} sections={page.sections} mediaAssets={[]} />;
}
