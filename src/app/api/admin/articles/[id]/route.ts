import { PublishState } from "@prisma/client";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { contentEntrySchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  const { data, response } = await parseJson(request, contentEntrySchema.partial());
  if (response) return response;

  const article = await prisma.article.update({
    where: { id },
    data: {
      locale: data.locale,
      title: data.title,
      slug: data.slug,
      excerpt: data.summary,
      content: data.content ? jsonInput(data.content) : undefined,
      status: data.status as PublishState | undefined,
      publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "update", entity: "Article", entityId: id } });
  return ok(article);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  await prisma.article.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "delete", entity: "Article", entityId: id } });
  return ok({ deleted: true });
}
