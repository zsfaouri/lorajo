import { Readable } from "node:stream";

import { DRIVE_ROOT_FOLDER_ID } from "@/lib/drive-folders";

type DriveUploadInput = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  folderId?: string;
};

type DriveUploadResult = {
  id: string;
  url: string;
  publicId: string;
  source: "google drive";
};

export type DriveBrowserItem = {
  id: string;
  name: string;
  mimeType: string;
  type: "folder" | "image" | "video";
  url: string | null;
  thumbnailUrl: string | null;
};

function cleanPrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function getRootFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || DRIVE_ROOT_FOLDER_ID;
}

async function getDriveClient() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  const { google } = await import("googleapis");
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: cleanPrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export function isGoogleDriveConfigured() {
  return Boolean(
    (process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) ||
    process.env.GOOGLE_API_KEY,
  );
}

export function googleDriveImageUrl(fileId: string) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`;
}

export function googleDriveVideoUrl(fileId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

export function googleDriveFileUrl(fileId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getFileIdFromHref(href: string) {
  return href.match(/\/file\/d\/([^/]+)/)?.[1] ?? href.match(/\/drive\/folders\/([^/?#"]+)/)?.[1] ?? "";
}

async function listGoogleDriveApiFolder(folderId: string): Promise<DriveBrowserItem[]> {
  const drive = await getDriveClient();
  if (!drive) return [];

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,webViewLink,thumbnailLink)",
    orderBy: "folder,name",
    pageSize: 1000,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (response.data.files ?? []).flatMap((file) => {
    const id = file.id;
    const name = file.name ?? "Untitled";
    const mimeType = file.mimeType ?? "";
    if (!id) return [];

    const isFolder = mimeType === "application/vnd.google-apps.folder";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");
    if (!isFolder && !isImage && !isVideo) return [];

    return [
      {
        id,
        name,
        mimeType,
        type: isFolder ? "folder" : isVideo ? "video" : "image",
        url: isVideo
          ? googleDriveVideoUrl(id)
          : file.webViewLink ?? (isFolder ? `https://drive.google.com/drive/folders/${id}` : `https://drive.google.com/file/d/${id}/view`),
        thumbnailUrl: isFolder ? null : googleDriveImageUrl(id),
      } satisfies DriveBrowserItem,
    ];
  });
}

async function listPublicGoogleDriveFolder(folderId: string, refreshKey = ""): Promise<DriveBrowserItem[]> {
  const url = new URL("https://drive.google.com/embeddedfolderview");
  url.searchParams.set("id", folderId);
  url.searchParams.set("_", refreshKey || String(Date.now()));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  timeout.unref?.();

  let html = "";
  try {
    const response = await fetch(`${url.toString()}#grid`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!response.ok) throw new Error("Could not read the public Google Drive folder.");
    html = await response.text();
  } finally {
    clearTimeout(timeout);
  }

  const entries = html.split('<div class="flip-entry"').slice(1);

  const parsed = entries
    .map((entry) => {
      const href = decodeHtml(entry.match(/<a href="([^"]+)"/)?.[1] ?? "");
      const name = decodeHtml(entry.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/)?.[1] ?? "Untitled");
      const id = getFileIdFromHref(href);
      const isFolder = href.includes("/drive/folders/");
      const isImage = href.includes("/file/d/") && /\.(avif|gif|jpe?g|png|webp|bmp|tiff?)$/i.test(name);
      const isVideo = href.includes("/file/d/") && /\.(mp4|m4v|mov|webm|ogg)$/i.test(name);
      if (!id || (!isFolder && !isImage && !isVideo)) return null;

      return {
        id,
        name,
        mimeType: isFolder ? "application/vnd.google-apps.folder" : isVideo ? "video/*" : "image/*",
        type: isFolder ? "folder" : isVideo ? "video" : "image",
        url: isVideo ? googleDriveVideoUrl(id) : href || null,
        thumbnailUrl: isFolder ? null : googleDriveImageUrl(id),
      } satisfies DriveBrowserItem;
    })
    .filter((item): item is DriveBrowserItem => Boolean(item));

  return [...new Map(parsed.map((item) => [item.id, item])).values()];
}

async function listGoogleDriveApiKeyFolder(folderId: string): Promise<DriveBrowserItem[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
  url.searchParams.set("fields", "files(id,name,mimeType,webViewLink,thumbnailLink)");
  url.searchParams.set("orderBy", "folder,name");
  url.searchParams.set("pageSize", "1000");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as { files?: Array<Record<string, string>> };
  return (data.files ?? []).flatMap((file) => {
    const id = file.id;
    const name = file.name ?? "Untitled";
    const mimeType = file.mimeType ?? "";
    if (!id) return [];

    const isFolder = mimeType === "application/vnd.google-apps.folder";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");
    if (!isFolder && !isImage && !isVideo) return [];

    return [
      {
        id,
        name,
        mimeType,
        type: isFolder ? "folder" : isVideo ? "video" : "image",
        url: isVideo
          ? googleDriveVideoUrl(id)
          : file.webViewLink ?? (isFolder ? `https://drive.google.com/drive/folders/${id}` : `https://drive.google.com/file/d/${id}/view`),
        thumbnailUrl: isFolder ? null : googleDriveImageUrl(id),
      } satisfies DriveBrowserItem,
    ];
  });
}

export async function listGoogleDriveFolder(folderId = getRootFolderId(), refreshKey = ""): Promise<DriveBrowserItem[]> {
  const apiItems = await listGoogleDriveApiFolder(folderId).catch(() => []);
  if (apiItems.length > 0) return apiItems;

  const apiKeyItems = await listGoogleDriveApiKeyFolder(folderId).catch(() => []);
  if (apiKeyItems.length > 0) return apiKeyItems;

  const publicItems = await listPublicGoogleDriveFolder(folderId, refreshKey).catch(() => []);
  if (publicItems.length > 0) return publicItems;
  return [];
}

export async function makeGoogleDriveFilePublic(fileId: string) {
  const drive = await getDriveClient();
  if (!drive) return;

  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "";
    if (!message.includes("already exists")) return;
  }
}

export async function createGoogleDriveFolder(name: string, parentFolderId = getRootFolderId()) {
  const drive = await getDriveClient();
  if (!drive) return null;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id, name, webViewLink",
    supportsAllDrives: true,
  });

  const id = created.data.id;
  if (!id) throw new Error("Google Drive did not return a folder id.");

  await makeGoogleDriveFilePublic(id);

  return {
    id,
    name: created.data.name ?? name,
    url: created.data.webViewLink ?? `https://drive.google.com/drive/folders/${id}`,
  };
}

export async function uploadToGoogleDrive({ fileName, mimeType, bytes, folderId }: DriveUploadInput): Promise<DriveUploadResult | null> {
  const drive = await getDriveClient();
  if (!drive) return null;

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId || getRootFolderId()],
    },
    media: {
      mimeType,
      body: Readable.from(bytes),
    },
    fields: "id",
  });

  const id = created.data.id;
  if (!id) throw new Error("Google Drive upload did not return a file id.");

  await makeGoogleDriveFilePublic(id);

  return {
    id,
    publicId: id,
    source: "google drive",
    url: mimeType.startsWith("image/") ? googleDriveImageUrl(id) : mimeType.startsWith("video/") ? googleDriveVideoUrl(id) : googleDriveFileUrl(id),
  };
}

// ─── Adapters for the new admin backend ──────────────────────────

export type DriveFolder = { id: string; name: string };
export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
};

/** List subfolders in a folder (new admin API). */
export async function listDriveFolders(parentId?: string): Promise<DriveFolder[]> {
  const items = await listGoogleDriveFolder(parentId);
  return items
    .filter((i) => i.type === "folder")
    .map((i) => ({ id: i.id, name: i.name }));
}

/** List image files in a folder (new admin API). */
export async function listDriveImages(
  folderId?: string,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const items = await listGoogleDriveFolder(folderId);
  const files = items
    .filter((i) => i.type === "image")
    .map((i) => ({
      id: i.id,
      name: i.name,
      mimeType: i.mimeType,
      thumbnailUrl: i.thumbnailUrl || googleDriveImageUrl(i.id),
    }));
  return { files };
}

/** Drive file ID → public thumbnail URL. */
export function driveFileUrl(fileId: string, width = 2000): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${width}`;
}
