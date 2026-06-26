import { fallbackGallery, fallbackMembers, fallbackPages } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

function logAdminDataError(scope: string, error: unknown) {
  console.error(`[admin-data] ${scope}:`, error instanceof Error ? error.message : error);
}

function fallbackAdminPages() {
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

function fallbackAdminMembers() {
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

function fallbackAdminGallery() {
  return fallbackGallery.map((collection) => ({
    id: collection.id,
    locale: "EN",
    title: collection.title,
    slug: collection.slug,
    status: "PUBLISHED",
    summary: `${collection.images.length} images`,
  }));
}

export async function listAdminPages() {
  const prisma = getPrisma();
  if (!prisma) return fallbackAdminPages();
  try {
    return await prisma.page.findMany({ orderBy: [{ locale: "asc" }, { slug: "asc" }] });
  } catch (error) {
    logAdminDataError("listAdminPages", error);
    return fallbackAdminPages();
  }
}

export async function listAdminEvents() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminEvents", error);
    return [];
  }
}

export async function listAdminProjects() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminProjects", error);
    return [];
  }
}

export async function listAdminArticles() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminArticles", error);
    return [];
  }
}

export async function listAdminMembers() {
  const prisma = getPrisma();
  if (!prisma) return fallbackAdminMembers();
  try {
    return await prisma.member.findMany({ include: { mediaAsset: true }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
  } catch (error) {
    logAdminDataError("listAdminMembers", error);
    return fallbackAdminMembers();
  }
}

export async function listAdminGallery() {
  const prisma = getPrisma();
  if (!prisma) return fallbackAdminGallery();
  try {
    return await prisma.galleryCollection.findMany({ include: { _count: { select: { images: true } } }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
  } catch (error) {
    logAdminDataError("listAdminGallery", error);
    return fallbackAdminGallery();
  }
}

export async function listAdminMessages() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminMessages", error);
    return [];
  }
}

export async function listAdminSubscribers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminSubscribers", error);
    return [];
  }
}

export async function listAdminVolunteers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.volunteerApplication.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminVolunteers", error);
    return [];
  }
}

export async function listAdminMedia() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.mediaAsset.findMany({
      where: { type: { in: ["IMAGE", "VIDEO"] }, source: { contains: "google drive", mode: "insensitive" } },
      select: { id: true, url: true, alt: true, caption: true, source: true, metadata: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logAdminDataError("listAdminMedia", error);
    return [];
  }
}

export async function listAdminUsers() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } });
  } catch (error) {
    logAdminDataError("listAdminUsers", error);
    return [];
  }
}

export async function listAdminRoles() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.role.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    logAdminDataError("listAdminRoles", error);
    return [];
  }
}

export async function listAdminFooterColumns() {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    return await prisma.footerColumn.findMany({ orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] });
  } catch (error) {
    logAdminDataError("listAdminFooterColumns", error);
    return [];
  }
}
