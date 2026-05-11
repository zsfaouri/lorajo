import { PublishState } from "@prisma/client";

import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { pageSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, pageSchema.partial());
  if (response) return response;

  const before = await prisma.page.findUnique({ where: { id } });
  const page = await prisma.page.update({
    where: { id },
    data: {
      ...data,
      status: data.status as PublishState | undefined,
      publishedAt: data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user?.id,
      action: "update",
      entity: "Page",
      entityId: id,
      before: auditPayload(before),
      after: auditPayload(page),
    },
  });

  return ok(page);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const before = await prisma.page.findUnique({ where: { id } });
  await prisma.page.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "delete", entity: "Page", entityId: id, before: auditPayload(before) },
  });

  return ok({ deleted: true });
}
