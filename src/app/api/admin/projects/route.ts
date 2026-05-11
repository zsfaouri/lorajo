import { PublishState } from "@prisma/client";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { contentEntrySchema } from "@/lib/validations";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.project.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { data, response } = await parseJson(request, contentEntrySchema);
  if (response) return response;

  const project = await prisma.project.create({
    data: { ...data, content: jsonInput(data.content), status: data.status as PublishState },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "Project", entityId: project.id } });
  return ok(project, { status: 201 });
}
