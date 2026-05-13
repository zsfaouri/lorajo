import { Readable } from "node:stream";

export const DEFAULT_GOOGLE_DRIVE_FOLDER_ID = "1JPsc0Lp5TbxU6AoO093NVgyJYaYVmK6v";

const KNOWN_ROOT_FOLDERS: DriveBrowserItem[] = [
  {
    id: "1EmcGth08yrQgkc5A6VgaBElbEqB3XRoq",
    name: "famous",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/1EmcGth08yrQgkc5A6VgaBElbEqB3XRoq",
    thumbnailUrl: null,
  },
  {
    id: "1gHayhyCYM2SYY5jkhdh29cLdreYbKmDa",
    name: "founders",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/1gHayhyCYM2SYY5jkhdh29cLdreYbKmDa",
    thumbnailUrl: null,
  },
  {
    id: "1FCkE90m-ZhDfTjcK8EX5gGs1mP6C7bTx",
    name: "hero",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/1FCkE90m-ZhDfTjcK8EX5gGs1mP6C7bTx",
    thumbnailUrl: null,
  },
  {
    id: "1eWXlLTs1YziUJV_2BqknAq102gw_Eik_",
    name: "historical pics",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/1eWXlLTs1YziUJV_2BqknAq102gw_Eik_",
    thumbnailUrl: null,
  },
  {
    id: "140eAQqvm1BS_vN1NA-YWGGI3TTK7uXI_",
    name: "landmarks",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/140eAQqvm1BS_vN1NA-YWGGI3TTK7uXI_",
    thumbnailUrl: null,
  },
  {
    id: "1ShI6iijKIBaEOuClc5W0sXRCNOYga3Lp",
    name: "pics",
    mimeType: "application/vnd.google-apps.folder",
    type: "folder",
    url: "https://drive.google.com/drive/folders/1ShI6iijKIBaEOuClc5W0sXRCNOYga3Lp",
    thumbnailUrl: null,
  },
];

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
  return Boolean(process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY);
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

async function listPublicGoogleDriveFolder(folderId: string, refreshKey = ""): Promise<DriveBrowserItem[]> {
  const url = new URL("https://drive.google.com/embeddedfolderview");
  url.searchParams.set("id", folderId);
  url.searchParams.set("_", refreshKey || String(Date.now()));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
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

  return [...new Map(parsed.map((item) => [item.id, item])).values()];
}

export async function listGoogleDriveFolder(folderId = getRootFolderId(), refreshKey = ""): Promise<DriveBrowserItem[]> {
  const publicItems = await listPublicGoogleDriveFolder(folderId, refreshKey).catch(() => []);
  if (publicItems.length > 0) return publicItems;
  if (folderId === DEFAULT_GOOGLE_DRIVE_FOLDER_ID) return KNOWN_ROOT_FOLDERS;
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

export async function uploadToGoogleDrive({ fileName, mimeType, bytes }: DriveUploadInput): Promise<DriveUploadResult | null> {
  const drive = await getDriveClient();
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
