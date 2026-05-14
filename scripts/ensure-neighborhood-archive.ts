import { Locale, Prisma, PrismaClient, PublishState } from "@prisma/client";

const prisma = new PrismaClient();

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function upsertNavigation(label: string, path: string, locale: Locale, sortOrder: number) {
  const existing = await prisma.navigationItem.findFirst({ where: { locale, path } });
  if (existing) {
    await prisma.navigationItem.update({
      where: { id: existing.id },
      data: { label, sortOrder, isVisible: true },
    });
    return;
  }

  await prisma.navigationItem.create({
    data: { label, path, locale, sortOrder, isVisible: true },
  });
}

async function upsertArchivePage(locale: Locale, title: string, pathPrefix: "en" | "ar") {
  const page = await prisma.page.upsert({
    where: { locale_slug: { locale, slug: "neighborhood-archive" } },
    update: {
      title,
      seoTitle: `${title} - LORA`,
      seoDescription: "A searchable library of neighborhood names, photos, videos, and memory fragments from Jabal Al-Luweibdeh.",
      status: PublishState.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      locale,
      slug: "neighborhood-archive",
      title,
      seoTitle: `${title} - LORA`,
      seoDescription: "A searchable library of neighborhood names, photos, videos, and memory fragments from Jabal Al-Luweibdeh.",
      status: PublishState.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const section = await prisma.pageSection.findFirst({
    where: { pageId: page.id, type: "neighborhood_archive" },
  });

  const sectionData = {
    pageId: page.id,
    sortOrder: 1,
    isVisible: true,
    type: "neighborhood_archive",
    variant: "searchable_library",
    content: json({
      title,
      subtitle: "Search names, photographs, videos, and memory fragments connected to Jabal Al-Luweibdeh.",
      path: `/${pathPrefix}/neighborhood-archive`,
    }),
    settings: json({ source: "google_drive", collection: "neighborhood-archive" }),
    spacing: json({ top: "large", bottom: "large" }),
    background: json({ token: "softWhite" }),
    alignment: "left",
  };

  if (section) {
    await prisma.pageSection.update({ where: { id: section.id }, data: sectionData });
  } else {
    await prisma.pageSection.create({ data: sectionData });
  }
}

async function main() {
  await prisma.componentVariant.upsert({
    where: { component_key: { component: "section_type", key: "neighborhood_archive" } },
    update: { label: "neighborhood archive", isEnabled: true },
    create: {
      component: "section_type",
      key: "neighborhood_archive",
      label: "neighborhood archive",
      config: json({}),
      isEnabled: true,
    },
  });

  await upsertNavigation("NEIGHBORHOOD ARCHIVE", "/en/neighborhood-archive", Locale.EN, 5);
  await upsertNavigation("Neighborhood Archive", "/ar/neighborhood-archive", Locale.AR, 5);

  await prisma.galleryCollection.upsert({
    where: { locale_slug: { locale: Locale.EN, slug: "neighborhood-archive" } },
    update: {
      title: "NEIGHBORHOOD ARCHIVE",
      description: "Searchable names, pictures, videos, and neighborhood memory records.",
      status: PublishState.PUBLISHED,
    },
    create: {
      locale: Locale.EN,
      slug: "neighborhood-archive",
      title: "NEIGHBORHOOD ARCHIVE",
      description: "Searchable names, pictures, videos, and neighborhood memory records.",
      sortOrder: 99,
      status: PublishState.PUBLISHED,
    },
  });

  await upsertArchivePage(Locale.EN, "Neighborhood Archive", "en");
  await upsertArchivePage(Locale.AR, "Neighborhood Archive", "ar");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
