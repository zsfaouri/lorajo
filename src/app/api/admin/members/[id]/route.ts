import { PublishState } from "@prisma/client";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { memberSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  const { data, response } = await parseJson(request, memberSchema.partial());
  if (response) return response;

  const member = await prisma.member.update({ where: { id }, data: { ...data, status: data.status as PublishState | undefined } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "update", entity: "Member", entityId: id } });
  return ok(member);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  await prisma.member.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "delete", entity: "Member", entityId: id } });
  return ok({ deleted: true });
}
