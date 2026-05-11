import { MediaType } from "@prisma/client";
import path from "node:path";

import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";
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

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return error("Missing file", 422);
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return error("Unsupported file type", 415);

  const bytes = Buffer.from(await file.arrayBuffer());
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  if (!getCloudinary() && bytes.length > 1_500_000) return error("Image is too large. Use an image under 1.5 MB or configure Cloudinary.", 413);

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
      },
    });

    return ok(asset, { status: 201 });
  }

  const extension = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  if (!file.type.startsWith("image/")) return error("Video uploads require Cloudinary.", 415);
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const uniqueKey = `db-upload-${Date.now()}-${file.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;

  const asset = await prisma.mediaAsset.create({
    data: {
      key: uniqueKey,
      type: MediaType.IMAGE,
      url: dataUrl,
      alt: String(form.get("alt") ?? file.name),
      bytes: bytes.length,
      format: extension.replace(".", ""),
      source: "database upload",
      metadata: { originalName: file.name, mimeType: file.type },
    },
  });

  return ok(asset, { status: 201 });
}
