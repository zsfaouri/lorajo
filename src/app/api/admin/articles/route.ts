import { PublishState } from "@prisma/client";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { DRIVE_ANNOUNCEMENTS_FOLDER_ID } from "@/lib/drive-folders";
import { createGoogleDriveFolder } from "@/lib/google-drive";
import { contentEntrySchema } from "@/lib/validations";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.article.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { data, response } = await parseJson(request, contentEntrySchema);
  if (response) return response;

  let article = await prisma.article.create({
    data: {
      locale: data.locale,
      title: data.title,
      slug: data.slug,
      excerpt: data.summary,
      content: jsonInput(data.content),
      status: data.status as PublishState,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  const folder = await createGoogleDriveFolder(article.title, DRIVE_ANNOUNCEMENTS_FOLDER_ID).catch(() => null);
  if (folder) {
    article = await prisma.article.update({ where: { id: article.id }, data: { driveFolderId: folder.id } });
  }
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "Article", entityId: article.id } });
  return ok(article, { status: 201 });
}
