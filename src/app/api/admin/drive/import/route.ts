import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";
import { driveFileUrl } from "@/lib/google-drive";

/**
 * Import Drive images into MediaAsset table.
 * Body: { files: Array<{ fileId: string, name: string, mimeType: string }> }
 */
export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const { files } = await parseBody<{
      files: Array<{ fileId: string; name: string; mimeType: string }>;
    }>(req);

    const created = [];
    const skipped = [];

    for (const f of files) {
      const url = driveFileUrl(f.fileId);

      // Skip if already imported
      const existing = await prisma.mediaAsset.findUnique({ where: { url } });
      if (existing) {
        skipped.push({ fileId: f.fileId, id: existing.id });
        continue;
      }

      const asset = await prisma.mediaAsset.create({
        data: {
          key: `drive-${f.fileId}`,
          type: "IMAGE",
          url,
          alt: f.name.replace(/\.[^/.]+$/, ""), // strip extension for alt
          source: "google_drive",
          format: f.mimeType.split("/")[1] || "jpeg",
          metadata: { driveFileId: f.fileId, originalName: f.name },
        },
      });
      created.push(asset);
    }

    if (created.length > 0) {
      await logAudit(prisma, {
        action: "IMPORT",
        entity: "MediaAsset",
        metadata: { email, count: created.length, source: "google_drive" },
      });
    }

    return { created: created.length, skipped: skipped.length, assets: created };
  });
}
