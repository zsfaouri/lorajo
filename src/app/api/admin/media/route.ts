import { MediaType } from "@prisma/client";

import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { googleDriveFileUrl, googleDriveImageUrl, googleDriveVideoUrl, makeGoogleDriveFilePublic, uploadToGoogleDrive } from "@/lib/google-drive";

function mediaTypeFromMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
  return MediaType.DOCUMENT;
}

function urlForDriveFile(fileId: string, mimeType: string) {
  if (mimeType.startsWith("image/")) return googleDriveImageUrl(fileId);
  if (mimeType.startsWith("video/")) return googleDriveVideoUrl(fileId);
  return googleDriveFileUrl(fileId);
}

function driveKey(fileId: string) {
  return `google-drive-${fileId.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.mediaAsset.findMany({ where: { source: { contains: "google drive", mode: "insensitive" } }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const contentType = request.headers.get("content-type") ?? "";
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return error("Choose a file to upload.", 422);

    const mimeType = file.type || "application/octet-stream";
    const allowed = mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/") || mimeType === "application/pdf";
    if (!allowed) return error("Upload images, videos, audio, or PDF files only.", 415);

    const bytes = Buffer.from(await file.arrayBuffer());
    const folderId = cleanString(form.get("folderId"));
    const category = cleanString(form.get("category"));
    const alt = cleanString(form.get("alt")) || file.name;
    const uploaded = await uploadToGoogleDrive({ fileName: file.name, mimeType, bytes, folderId: folderId || undefined });
    if (!uploaded) return error("Google Drive write access is not configured. Add GOOGLE_DRIVE_CLIENT_EMAIL and GOOGLE_DRIVE_PRIVATE_KEY.", 503);

    const asset = await prisma.mediaAsset.upsert({
      where: { url: uploaded.url },
      update: {
        type: mediaTypeFromMime(mimeType),
        secureUrl: uploaded.url,
        publicId: uploaded.id,
        alt,
        source: "google drive",
        bytes: file.size,
        format: mimeType,
        metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: file.name, mimeType, driveFolderId: folderId || null },
      },
      create: {
        key: driveKey(uploaded.id),
        type: mediaTypeFromMime(mimeType),
        url: uploaded.url,
        secureUrl: uploaded.url,
        publicId: uploaded.id,
        alt,
        source: "google drive",
        bytes: file.size,
        format: mimeType,
        metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: file.name, mimeType, driveFolderId: folderId || null },
      },
    });

    return ok(asset, { status: 201 });
  }

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const driveFileId = typeof body.driveFileId === "string" ? body.driveFileId.trim() : "";
    const driveFileName = typeof body.driveFileName === "string" ? body.driveFileName.trim() : "";
    const driveMimeType = typeof body.driveMimeType === "string" ? body.driveMimeType.trim() : "";
    if (driveFileId) {
      await makeGoogleDriveFilePublic(driveFileId);
      const category = typeof body.category === "string" ? body.category.trim() : "";
      const folderId = typeof body.folderId === "string" ? body.folderId.trim() : "";
      const url = urlForDriveFile(driveFileId, driveMimeType);
      const asset = await prisma.mediaAsset.upsert({
        where: { url },
        update: {
          type: mediaTypeFromMime(driveMimeType),
          secureUrl: url,
          publicId: driveFileId,
          alt: typeof body.alt === "string" && body.alt.trim() ? body.alt.trim() : driveFileName || "Google Drive file",
          source: "google drive",
          metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: driveFileName, mimeType: driveMimeType, driveFolderId: folderId || null },
        },
        create: {
          key: driveKey(driveFileId),
          type: mediaTypeFromMime(driveMimeType),
          url,
          secureUrl: url,
          publicId: driveFileId,
          alt: typeof body.alt === "string" && body.alt.trim() ? body.alt.trim() : driveFileName || "Google Drive file",
          source: "google drive",
          metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalName: driveFileName, mimeType: driveMimeType, driveFolderId: folderId || null },
        },
      });

      return ok(asset, { status: 201 });
    }

    return error("Select a file from Google Drive.", 422);
  }

  return error("Use a file upload or Google Drive selection from Media Cloud.", 415);
}
