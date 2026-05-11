import { auditPayload, error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { sectionSchema } from "@/lib/validations";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, sectionSchema.partial());
  if (response) return response;

  const before = await prisma.pageSection.findUnique({ where: { id } });
  const section = await prisma.pageSection.update({
    where: { id },
    data: {
      ...data,
      content: data.content ? jsonInput(data.content) : undefined,
      settings: data.settings ? jsonInput(data.settings) : undefined,
      spacing: data.spacing ? jsonInput(data.spacing) : undefined,
      background: data.background ? jsonInput(data.background) : undefined,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user?.id,
      action: "update",
      entity: "PageSection",
      entityId: id,
      before: auditPayload(before),
      after: auditPayload(section),
    },
  });

  return ok(section);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const before = await prisma.pageSection.findUnique({ where: { id } });
  await prisma.pageSection.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "delete", entity: "PageSection", entityId: id, before: auditPayload(before) },
  });

  return ok({ deleted: true });
}
