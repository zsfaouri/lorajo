import { MediaType } from "@prisma/client";

import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { googleDriveImageUrl, makeGoogleDriveFilePublic } from "@/lib/google-drive";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.mediaAsset.findMany({ where: { type: "IMAGE", source: "google drive" }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const contentType = request.headers.get("content-type") ?? "";
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const driveFileId = typeof body.driveFileId === "string" ? body.driveFileId.trim() : "";
    const driveFileName = typeof body.driveFileName === "string" ? body.driveFileName.trim() : "";
    const driveMimeType = typeof body.driveMimeType === "string" ? body.driveMimeType.trim() : "";
    if (driveFileId) {
      if (!driveMimeType.startsWith("image/")) return error("Only Google Drive image files can be selected.", 415);
      await makeGoogleDriveFilePublic(driveFileId);
      const category = typeof body.category === "string" ? body.category.trim() : "";
      const url = googleDriveImageUrl(driveFileId);
      const asset = await prisma.mediaAsset.upsert({
        where: { url },
        update: {
          type: MediaType.IMAGE,
          secureUrl: url,
          publicId: driveFileId,
          alt: typeof body.alt === "string" && body.alt.trim() ? body.alt.trim() : driveFileName || "Google Drive image",
          source: "google drive",
          metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: driveFileName, mimeType: driveMimeType },
        },
        create: {
          key: `google-drive-${driveFileId.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
          type: MediaType.IMAGE,
          url,
          secureUrl: url,
          publicId: driveFileId,
          alt: typeof body.alt === "string" && body.alt.trim() ? body.alt.trim() : driveFileName || "Google Drive image",
          source: "google drive",
          metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: driveFileName, mimeType: driveMimeType },
        },
      });

      return ok(asset, { status: 201 });
    }

    return error("Select an image from Google Drive.", 422);
  }

  return error("Use Google Drive selection from Media Cloud.", 415);
}
