import { MediaType } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { uploadToGoogleDrive } from "@/lib/google-drive";
import { isGoogleDriveFolderUrl, toGoogleDriveImageUrl } from "@/lib/google-drive-url";
import { getCloudinary } from "@/lib/media";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const contentType = request.headers.get("content-type") ?? "";
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  if (contentType.includes("application/json")) {
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url : "";
    if (!url || !url.startsWith("https://")) return error("Invalid media URL", 422);
    if (isGoogleDriveFolderUrl(url)) return error("Paste a Google Drive image file link, not a folder link.", 422);
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const mediaUrl = toGoogleDriveImageUrl(url);

    const asset = await prisma.mediaAsset.create({
      data: {
        key: `supabase-${String(body.publicId ?? Date.now()).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
        type: MediaType.IMAGE,
        url: mediaUrl,
        secureUrl: mediaUrl,
        publicId: typeof body.publicId === "string" ? body.publicId : null,
        alt: typeof body.alt === "string" ? body.alt : "Media image",
        bytes: typeof body.bytes === "number" ? body.bytes : null,
        format: typeof body.format === "string" ? body.format : null,
        source: typeof body.source === "string" ? body.source : url.includes("drive.google.com") ? "google drive link" : "external url",
        metadata: { uploadedBy: session.user?.id ?? null, category: category || null, originalUrl: url },
      },
    });

    return ok(asset, { status: 201 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const category = String(form.get("category") ?? "").trim();
  if (!(file instanceof File)) return error("Missing file", 422);
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return error("Unsupported file type", 415);

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const safeName = file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase() || `upload${extension}`;

  const googleDriveUpload = await uploadToGoogleDrive({ fileName: `${Date.now()}-${safeName}`, mimeType: file.type, bytes });
  if (googleDriveUpload) {
    const asset = await prisma.mediaAsset.create({
      data: {
        key: `google-drive-${googleDriveUpload.publicId.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
        type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE,
        url: googleDriveUpload.url,
        secureUrl: googleDriveUpload.url,
        publicId: googleDriveUpload.publicId,
        alt: String(form.get("alt") ?? file.name),
        bytes: bytes.length,
        format: extension.replace(".", ""),
        source: "google drive",
        metadata: { originalName: file.name, mimeType: file.type, category: category || null },
      },
    });

    return ok(asset, { status: 201 });
  }

  const cloudinary = getCloudinary();
  if (cloudinary) {
    const upload = await new Promise<{ secure_url: string; public_id: string; width?: number; height?: number; bytes?: number; format?: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "lora-cms", resource_type: file.type.startsWith("video/") ? "video" : "image" }, (err, result) => {
            if (err || !result) reject(err);
            else resolve(result);
          })
          .end(bytes);
      },
    );

    const asset = await prisma.mediaAsset.create({
      data: {
        key: `cloudinary-${upload.public_id.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
        type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE,
        url: upload.secure_url,
        secureUrl: upload.secure_url,
        publicId: upload.public_id,
        alt: String(form.get("alt") ?? file.name),
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
        format: upload.format,
        source: "cloudinary",
        metadata: { originalName: file.name, mimeType: file.type, category: category || null },
      },
    });

    return ok(asset, { status: 201 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return error("Media storage is not configured", 503);
  if (!file.type.startsWith("image/")) return error("Video uploads require Cloudinary.", 415);

  const storagePath = `admin/${Date.now()}-${safeName || `upload${extension}`}`;
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const upload = await supabase.storage.from("lora-media").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) {
    const message = upload.error.message.includes("maximum allowed size")
      ? "Storage rejected this file because the Supabase bucket or plan size limit is too low. Raise the Supabase Storage global and bucket file size limits, or connect a large-file media provider."
      : upload.error.message;
    return error(message, 502);
  }
  const publicUrl = supabase.storage.from("lora-media").getPublicUrl(storagePath).data.publicUrl;

  const asset = await prisma.mediaAsset.create({
    data: {
      key: `supabase-${storagePath.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`,
      type: MediaType.IMAGE,
      url: publicUrl,
      secureUrl: publicUrl,
      publicId: storagePath,
      alt: String(form.get("alt") ?? file.name),
      bytes: bytes.length,
      format: extension.replace(".", ""),
      source: "supabase storage",
      metadata: { originalName: file.name, mimeType: file.type, category: category || null },
    },
  });

  return ok(asset, { status: 201 });
}
