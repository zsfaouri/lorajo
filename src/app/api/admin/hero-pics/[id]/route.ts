import { PublishState, type Locale } from "@prisma/client";
import { z } from "zod";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { fallbackPages } from "@/lib/fallback-data";
import type { LocaleCode } from "@/types/cms";

const schema = z.object({
  type: z.string().min(1),
  variant: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  content: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
});

function toPrismaLocale(locale: LocaleCode): Locale {
  return locale === "ar" ? "AR" : "EN";
}

function findFallbackSection(sectionId: string) {
  for (const [locale, pages] of Object.entries(fallbackPages) as Array<[LocaleCode, (typeof fallbackPages)[LocaleCode]]>) {
    for (const page of Object.values(pages)) {
      const section = page.sections.find((item) => item.id === sectionId);
      if (section) return { locale, page, section };
    }
  }
  return null;
}

function heroImageObjects(content: Record<string, unknown>, settings: Record<string, unknown>) {
  const frames = Array.isArray(settings.heroScrubFrames)
    ? settings.heroScrubFrames.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  const fallbackImage = typeof content.image === "string" && content.image.length > 0 ? content.image : null;
  const urls = frames.length > 0 ? frames : fallbackImage ? [fallbackImage] : [];

  return urls.map((src, index) => ({
    src,
    alt: index === 0 ? "What We Do hero image" : `What We Do hero image ${index + 1}`,
    caption: "",
  }));
}

async function syncWhatWeDoHeroImages(pageId: string, content: Record<string, unknown>, settings: Record<string, unknown>) {
  const prisma = requirePrisma();
  if (!prisma) return;

  const target = await prisma.pageSection.findFirst({
    where: {
      pageId,
      type: "rich_text",
      variant: "what_we_do_gallery",
    },
  });

  if (!target) return;
  const currentContent = target.content && typeof target.content === "object" && !Array.isArray(target.content)
    ? (target.content as Record<string, unknown>)
    : {};

  await prisma.$executeRawUnsafe(
    'update "PageSection" set content = $1::jsonb, "updatedAt" = now() where id = $2',
    JSON.stringify({
      ...currentContent,
      images: heroImageObjects(content, settings),
    }),
    target.id,
  );
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  const existing = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { id: true, slug: true } } },
  });
  if (existing) {
    const section = await prisma.pageSection.update({
      where: { id },
      data: {
        type: data.type,
        variant: data.variant,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        content: jsonInput(data.content),
        settings: jsonInput(data.settings),
      },
    });

    if (existing.page.slug === "what-we-do") {
      await syncWhatWeDoHeroImages(existing.page.id, data.content, data.settings);
    }

    return ok(section);
  }

  const fallback = findFallbackSection(id);
  if (!fallback) return error("Hero section not found", 404);

  const locale = toPrismaLocale(fallback.locale);
  const page = await prisma.page.upsert({
    where: { locale_slug: { locale, slug: fallback.page.slug } },
    update: {
      title: fallback.page.title,
      seoTitle: fallback.page.seoTitle,
      seoDescription: fallback.page.seoDescription,
      status: PublishState.PUBLISHED,
    },
    create: {
      id: fallback.page.id,
      locale,
      slug: fallback.page.slug,
      title: fallback.page.title,
      seoTitle: fallback.page.seoTitle,
      seoDescription: fallback.page.seoDescription,
      status: PublishState.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  for (const fallbackSection of fallback.page.sections) {
    const content = fallbackSection.id === id ? data.content : fallbackSection.content;
    const settings = fallbackSection.id === id ? data.settings : fallbackSection.settings;
    await prisma.pageSection.upsert({
      where: { id: fallbackSection.id },
      update: {
        pageId: page.id,
        type: fallbackSection.id === id ? data.type : fallbackSection.type,
        variant: fallbackSection.id === id ? data.variant : fallbackSection.variant,
        sortOrder: fallbackSection.sortOrder,
        isVisible: fallbackSection.isVisible,
        content: jsonInput(content),
        settings: jsonInput(settings),
        spacing: jsonInput(fallbackSection.spacing ?? { top: "large", bottom: "large" }),
        background: jsonInput(fallbackSection.background ?? { token: "parchment" }),
        alignment: fallbackSection.alignment ?? "left",
      },
      create: {
        id: fallbackSection.id,
        pageId: page.id,
        type: fallbackSection.id === id ? data.type : fallbackSection.type,
        variant: fallbackSection.id === id ? data.variant : fallbackSection.variant,
        sortOrder: fallbackSection.sortOrder,
        isVisible: fallbackSection.isVisible,
        content: jsonInput(content),
        settings: jsonInput(settings),
        spacing: jsonInput(fallbackSection.spacing ?? { top: "large", bottom: "large" }),
        background: jsonInput(fallbackSection.background ?? { token: "parchment" }),
        alignment: fallbackSection.alignment ?? "left",
      },
    });
  }

  if (fallback.page.slug === "what-we-do") {
    await syncWhatWeDoHeroImages(page.id, data.content, data.settings);
  }

  const saved = await prisma.pageSection.findUnique({ where: { id } });
  return ok(saved);
}
