import { Readable } from "node:stream";

import { google } from "googleapis";

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

function cleanPrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

export function isGoogleDriveConfigured() {
  return Boolean(process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

export async function uploadToGoogleDrive({ fileName, mimeType, bytes }: DriveUploadInput): Promise<DriveUploadResult | null> {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!clientEmail || !privateKey || !folderId) return null;

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: cleanPrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const drive = google.drive({ version: "v3", auth });

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(bytes),
    },
    fields: "id",
  });

  const id = created.data.id;
  if (!id) throw new Error("Google Drive upload did not return a file id.");

  await drive.permissions.create({
    fileId: id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    id,
    publicId: id,
    source: "google drive",
    url: `https://drive.google.com/uc?export=view&id=${id}`,
  };
}
