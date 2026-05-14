-- Add drive folder linkage for targeted Google Drive sync.
ALTER TABLE "GalleryCollection" ADD COLUMN IF NOT EXISTS "driveFolderId" TEXT;
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "driveFolderId" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "driveFolderId" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "driveFolderId" TEXT;