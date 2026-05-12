import { Readable } from "node:stream";

import { google } from "googleapis";

export const DEFAULT_GOOGLE_DRIVE_FOLDER_ID = "1JPsc0Lp5TbxU6AoO093NVgyJYaYVmK6v";

type DriveUploadInput = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
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
  type: "folder" | "image";
  url: string | null;
  thumbnailUrl: string | null;
};

function cleanPrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function getRootFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_GOOGLE_DRIVE_FOLDER_ID;
}

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: cleanPrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export function isGoogleDriveConfigured() {
  return Boolean(getDriveClient());
}

export function googleDriveImageUrl(fileId: string) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`;
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

async function listPublicGoogleDriveFolder(folderId: string): Promise<DriveBrowserItem[]> {
  const response = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#grid`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not read the public Google Drive folder.");

  const html = await response.text();
  const entries = html.split('<div class="flip-entry"').slice(1);

  return entries
    .map((entry) => {
      const href = decodeHtml(entry.match(/<a href="([^"]+)"/)?.[1] ?? "");
      const name = decodeHtml(entry.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/)?.[1] ?? "Untitled");
      const id = getFileIdFromHref(href);
      const isFolder = href.includes("/drive/folders/");
      const isImage = href.includes("/file/d/") && /\.(avif|gif|jpe?g|png|webp|bmp|tiff?)$/i.test(name);
      if (!id || (!isFolder && !isImage)) return null;

      return {
        id,
        name,
        mimeType: isFolder ? "application/vnd.google-apps.folder" : "image/*",
        type: isFolder ? "folder" : "image",
        url: href || null,
        thumbnailUrl: isFolder ? null : googleDriveImageUrl(id),
      } satisfies DriveBrowserItem;
    })
    .filter((item): item is DriveBrowserItem => Boolean(item));
}

export async function listGoogleDriveFolder(folderId = getRootFolderId()): Promise<DriveBrowserItem[]> {
  const publicItems = await listPublicGoogleDriveFolder(folderId);
  if (publicItems.length > 0) return publicItems;

  const drive = getDriveClient();
  if (!drive) return [];

  const response = await drive.files.list({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/')`,
    fields: "files(id,name,mimeType,webViewLink,thumbnailLink)",
    orderBy: "folder,name_natural",
    pageSize: 200,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (response.data.files ?? []).map((file) => {
    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
    return {
      id: file.id ?? "",
      name: file.name ?? "Untitled",
      mimeType: file.mimeType ?? "",
      type: isFolder ? "folder" : "image",
      url: file.webViewLink ?? null,
      thumbnailUrl: isFolder || !file.id ? null : googleDriveImageUrl(file.id),
    };
  });
}

export async function makeGoogleDriveFilePublic(fileId: string) {
  const drive = getDriveClient();
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

export async function uploadToGoogleDrive({ fileName, mimeType, bytes }: DriveUploadInput): Promise<DriveUploadResult | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [getRootFolderId()],
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
    url: googleDriveImageUrl(id),
  };
}
