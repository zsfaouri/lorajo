import { ok, error, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { getGalleryCollections, getNavigation, getNeighborhoodArchiveItems, getPageBySlug } from "@/lib/cms-data";
import { DRIVE_ROOT_FOLDER_ID } from "@/lib/drive-folders";
import { listGoogleDriveFolder } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TestState = "pass" | "fail" | "warn";

type SystemTest = {
  key: string;
  label: string;
  state: TestState;
  detail: string;
};

async function runTest(key: string, label: string, test: () => Promise<string | { state?: TestState; detail: string }>): Promise<SystemTest> {
  try {
    const result = await test();
    if (typeof result === "string") return { key, label, state: "pass", detail: result };
    return { key, label, state: result.state ?? "pass", detail: result.detail };
  } catch (caught) {
    return {
      key,
      label,
      state: "fail",
      detail: caught instanceof Error ? caught.message : "Unknown failure",
    };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Request timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function envState(name: string) {
  return process.env[name] ? "set" : "missing";
}

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  const tests = await Promise.all([
    runTest("env", "Runtime environment", async () => {
      const required = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "AUTH_SECRET"];
      const optional = ["GOOGLE_DRIVE_CLIENT_EMAIL", "GOOGLE_DRIVE_PRIVATE_KEY", "GOOGLE_DRIVE_API_KEY"];
      const missingRequired = required.filter((name) => !process.env[name]);
      const missingOptional = optional.filter((name) => !process.env[name]);
      if (missingRequired.length > 0) return { state: "fail", detail: `Missing required env: ${missingRequired.join(", ")}` };
      if (missingOptional.length === optional.length) return { state: "warn", detail: "Admin login env is set, but Drive service/API credentials are not set. Public folder fallback may still read Drive." };
      return `Required env set. Drive env: ${optional.map((name) => `${name}=${envState(name)}`).join(", ")}`;
    }),
    runTest("database", "CMS database", async () => {
      if (!prisma) return { state: "fail", detail: "DATABASE_URL is not configured." };
      await prisma.$queryRaw`select 1`;
      const [pages, collections, assets] = await Promise.all([
        prisma.page.count(),
        prisma.galleryCollection.count(),
        prisma.mediaAsset.count({ where: { source: "google drive" } }),
      ]);
      return `${pages} pages, ${collections} gallery collections, ${assets} Google Drive media assets.`;
    }),
    runTest("public-page", "Admin to frontend page data", async () => {
      const page = await getPageBySlug("en", "who-we-are");
      if (!page) return { state: "fail", detail: "Public page loader cannot read /en/who-we-are." };
      const visibleSections = page.sections.filter((section) => section.isVisible).length;
      return `Public loader reads "${page.title}" with ${visibleSections} visible sections.`;
    }),
    runTest("navigation", "Public navigation", async () => {
      const nav = await getNavigation("en");
      const paths = nav.map((item) => item.path);
      const missing = ["/en/who-we-are", "/en/photo-gallery", "/en/neighborhood-archive", "/en/join-us"].filter((path) => !paths.includes(path));
      if (missing.length > 0) return { state: "fail", detail: `Missing public nav paths: ${missing.join(", ")}` };
      return `${nav.length} public navigation items mapped.`;
    }),
    runTest("gallery", "Photo Gallery API data", async () => {
      const gallery = await getGalleryCollections("en");
      const images = gallery.reduce((count, collection) => count + collection.images.length, 0);
      const missing = ["historical-photos", "landmarks", "famous-figures"].filter((slug) => !gallery.some((collection) => collection.slug === slug));
      if (missing.length > 0) return { state: "fail", detail: `Missing gallery categories: ${missing.join(", ")}` };
      return `${gallery.length} categories, ${images} public images.`;
    }),
    runTest("archive", "Neighborhood Archive API data", async () => {
      const archive = await getNeighborhoodArchiveItems("en");
      if (archive.length === 0) return { state: "warn", detail: "Archive API is reachable but has no records." };
      return `${archive.length} archive records from database/Drive/fallback.`;
    }),
    runTest("drive", "Google Drive root", async () => {
      const items = await withTimeout(listGoogleDriveFolder(process.env.GOOGLE_DRIVE_FOLDER_ID || DRIVE_ROOT_FOLDER_ID, String(Date.now())));
      const folders = items.filter((item) => item.type === "folder").length;
      if (items.length === 0) return { state: "warn", detail: "Drive root was reachable but returned no folders/files." };
      return `${items.length} Drive items visible at root, including ${folders} folders.`;
    }),
    runTest("drive-only-media", "Google Drive media rule", async () => {
      if (!prisma) return { state: "fail", detail: "Database unavailable; cannot enforce media source rule." };
      const activeNonDrive = await prisma.galleryImage.count({
        where: {
          collection: {
            slug: { in: ["historical-photos", "landmarks", "famous-figures", "neighborhood-archive"] },
            status: "PUBLISHED",
          },
          mediaAsset: {
            NOT: {
              OR: [{ source: { contains: "google drive" } }, { source: { contains: "Google Drive" } }],
            },
          },
        },
      });
      if (activeNonDrive > 0) return { state: "fail", detail: `${activeNonDrive} active gallery/archive records are not backed by Google Drive.` };
      const legacyNonDrive = await prisma.mediaAsset.count({
        where: {
          NOT: {
            OR: [{ source: { contains: "google drive" } }, { source: { contains: "Google Drive" } }],
          },
        },
      });
      if (legacyNonDrive > 0) return { state: "warn", detail: `Active public media is Drive-backed. ${legacyNonDrive} unused legacy media records are not Drive-backed.` };
      return "All stored media assets are backed by Google Drive.";
    }),
  ]);

  const failed = tests.filter((test) => test.state === "fail").length;
  const warnings = tests.filter((test) => test.state === "warn").length;

  return ok({
    status: failed > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
    checkedAt: new Date().toISOString(),
    tests,
  });
}
