import { HeroPicsManager } from "@/components/admin/hero-pics-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminMedia } from "@/lib/admin-data";
import { DRIVE_FOLDER_REGISTRY } from "@/lib/drive-folders";
import { fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";
import type { LocaleCode } from "@/types/cms";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function fallbackHeroSections() {
  return (Object.entries(fallbackPages) as Array<[LocaleCode, (typeof fallbackPages)[LocaleCode]]>).flatMap(([locale, pages]) =>
    Object.values(pages).flatMap((page) =>
      page.sections
        .filter((section) => section.type === "hero" || section.type === "video_scroll_hero")
        .map((section) => ({
          id: section.id,
          isStarter: true,
          pageTitle: page.title,
          pageSlug: page.slug,
          locale: locale.toUpperCase(),
          title: typeof section.content.title === "string" ? section.content.title : "",
          type: section.type,
          variant: section.variant,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          content: section.content,
          settings: section.settings,
        })),
    ),
  );
}

export default async function AdminHeroPicsPage() {
  await requireAdmin();
  const prisma = getPrisma();
  if (!prisma) return <HeroPicsManager initialSections={fallbackHeroSections()} mediaAssets={[]} folderId={DRIVE_FOLDER_REGISTRY["hero-pics"]} />;

  const [sections, mediaAssets] = await Promise.all([
    prisma.pageSection.findMany({
      where: { type: { in: ["hero", "video_scroll_hero"] } },
      include: { page: { select: { title: true, slug: true, locale: true } } },
      orderBy: [{ page: { locale: "asc" } }, { page: { slug: "asc" } }, { sortOrder: "asc" }],
    }),
    listAdminMedia(),
  ]);

  const mappedSections = sections.map((section) => ({
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
  }));

  return (
    <HeroPicsManager
      initialSections={mappedSections.length > 0 ? mappedSections : fallbackHeroSections()}
      mediaAssets={mediaAssets}
      folderId={DRIVE_FOLDER_REGISTRY["hero-pics"]}
    />
  );
}
