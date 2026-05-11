import { MediaType } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const extension = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  if (!supabaseUrl || !supabaseKey) return error("Media storage is not configured", 503);
  if (!file.type.startsWith("image/")) return error("Video uploads require Cloudinary.", 415);
  if (bytes.length > 5_000_000) return error("Image is too large. Use an image under 5 MB.", 413);

  const safeName = file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
  const storagePath = `admin/${Date.now()}-${safeName || `upload${extension}`}`;
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const upload = await supabase.storage.from("lora-media").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) return error(upload.error.message, 502);
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
      metadata: { originalName: file.name, mimeType: file.type },
    },
  });

  return ok(asset, { status: 201 });
}
