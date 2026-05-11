import { MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
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

  const uploadId = randomUUID();
  const extension = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const fileName = `${uploadId}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "lora", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), bytes);

  const asset = await prisma.mediaAsset.create({
    data: {
      key: `local-upload-${uploadId}`,
      type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE,
      url: `/api/uploads/${fileName}`,
      alt: String(form.get("alt") ?? file.name),
      bytes: bytes.length,
      format: extension.replace(".", ""),
      source: "local upload",
      metadata: { originalName: file.name, mimeType: file.type },
    },
  });

  return ok(asset, { status: 201 });
}
