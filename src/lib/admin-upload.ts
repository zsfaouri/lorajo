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

  const form = new FormData();
  form.append("file", file);
  form.append("alt", alt || file.name);
  form.append("category", category);

  const response = await fetch("/api/admin/media", {
    method: "POST",
    body: form,
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
