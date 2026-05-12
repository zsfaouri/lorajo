const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/?#]+)/i,
  /drive\.google\.com\/open\?id=([^&#]+)/i,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/i,
  /drive\.google\.com\/thumbnail\?(?:[^#]*&)?id=([^&#]+)/i,
];

export function getGoogleDriveFileId(url: string) {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

export function isGoogleDriveFolderUrl(url: string) {
  return /drive\.google\.com\/drive\/folders\//i.test(url);
}

export function toGoogleDriveImageUrl(url: string) {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`;
}
