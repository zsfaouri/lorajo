import { createClient } from "@supabase/supabase-js";

export type UploadedAsset = {
  id: string;
  url?: string;
  src?: string;
  alt?: string | null;
  caption?: string | null;
  metadata?: unknown;
};

export async function uploadAdminImage(file: File, alt: string, category = ""): Promise<UploadedAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Use an image file: JPG, PNG, WebP, or GIF.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Media storage is not configured.");
  }

  const safeName = file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
  const storagePath = `admin/${Date.now()}-${safeName || "upload"}`;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const upload = await supabase.storage.from("lora-media").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) {
    const message = upload.error.message.includes("maximum allowed size")
      ? "Storage rejected this file because the Supabase bucket or plan size limit is too low. Raise the Supabase Storage global and bucket file size limits, or connect a large-file media provider."
      : upload.error.message;
    throw new Error(message);
  }

  const publicUrl = supabase.storage.from("lora-media").getPublicUrl(storagePath).data.publicUrl;

  const response = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: publicUrl,
      publicId: storagePath,
      alt: alt || file.name,
      category,
      bytes: file.size,
      format: file.name.split(".").pop()?.toLowerCase() || "",
      source: "supabase storage",
    }),
  });
  const text = await response.text();
  let json: unknown = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || "Upload failed.");
  }

  if (!response.ok) {
    const message = json && typeof json === "object" && "error" in json ? String(json.error) : "Upload failed.";
    throw new Error(message);
  }

  if (!json || typeof json !== "object" || !("id" in json)) {
    throw new Error("Upload failed.");
  }

  return json as UploadedAsset;
}
