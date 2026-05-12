import { HeroPicsManager } from "@/components/admin/hero-pics-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export default async function AdminHeroPicsPage() {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return <HeroPicsManager initialSections={[]} mediaAssets={[]} />;

  const [sections, mediaAssets] = await Promise.all([
    prisma.pageSection.findMany({
      where: { type: { in: ["hero", "video_scroll_hero"] } },
      include: { page: { select: { title: true, slug: true, locale: true } } },
      orderBy: [{ page: { locale: "asc" } }, { page: { slug: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.mediaAsset.findMany({
      where: { type: "IMAGE" },
      select: { id: true, url: true, alt: true, caption: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <HeroPicsManager
      initialSections={sections.map((section) => ({
        id: section.id,
        pageTitle: section.page.title,
        pageSlug: section.page.slug,
        locale: section.page.locale,
        title: typeof asRecord(section.content).title === "string" ? String(asRecord(section.content).title) : "",
        type: section.type,
        variant: section.variant,
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
        content: asRecord(section.content),
        settings: asRecord(section.settings),
      }))}
      mediaAssets={mediaAssets}
    />
  );
}
