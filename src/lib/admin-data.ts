import { fallbackGallery, fallbackMembers, fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

export async function listAdminPages() {
  const prisma = getPrisma();
  if (!prisma) {
    return Object.values(fallbackPages)
      .flatMap((pages) => Object.values(pages))
      .map((page) => ({
        id: page.id,
        locale: page.locale.toUpperCase(),
        title: page.title,
        slug: page.slug,
        status: page.status,
        summary: `${page.sections.length} sections`,
      }));
  }

  return prisma.page.findMany({ orderBy: [{ locale: "asc" }, { slug: "asc" }] });
}

export async function listAdminEvents() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.event.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminProjects() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminArticles() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.article.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminMembers() {
  const prisma = getPrisma();
  if (!prisma) {
    return fallbackMembers.map((member) => ({
      id: member.id,
      locale: "EN",
      name: member.name,
      title: member.title,
      slug: member.slug,
      sortOrder: member.sortOrder,
      isFounder: true,
      status: "PUBLISHED",
      mediaAsset: member.image
        ? {
            id: `${member.id}-image`,
            url: member.image.src,
            alt: member.image.alt,
            caption: member.image.caption,
          }
        : null,
    }));
  }
  return prisma.member.findMany({ include: { mediaAsset: true }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
}

export async function listAdminGallery() {
  const prisma = getPrisma();
  if (!prisma) {
    return fallbackGallery.map((collection) => ({
      id: collection.id,
      locale: "EN",
      title: collection.title,
      slug: collection.slug,
      status: "PUBLISHED",
      summary: `${collection.images.length} images`,
    }));
  }
  return prisma.galleryCollection.findMany({ include: { _count: { select: { images: true } } }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
}

export async function listAdminMessages() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminSubscribers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminVolunteers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.volunteerApplication.findMany({ orderBy: { createdAt: "desc" } });
}

export async function listAdminMedia() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.mediaAsset.findMany({
    where: { type: "IMAGE", source: "google drive" },
    select: { id: true, url: true, alt: true, caption: true, source: true, metadata: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminUsers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAdminRoles() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function listAdminFooterColumns() {
  const prisma = getPrisma();
  if (!prisma) return [];
  return prisma.footerColumn.findMany({ orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
}
