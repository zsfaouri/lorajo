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

  const project = await prisma.project.update({
    where: { id },
    data: { ...data, content: data.content ? jsonInput(data.content) : undefined, status: data.status as PublishState | undefined },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "update", entity: "Project", entityId: id } });
  return ok(project);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  await prisma.project.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "delete", entity: "Project", entityId: id } });
  return ok({ deleted: true });
}
