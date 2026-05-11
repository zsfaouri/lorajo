import { PublishState } from "@prisma/client";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { memberSchema } from "@/lib/validations";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.member.findMany({ include: { mediaAsset: true }, orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { data, response } = await parseJson(request, memberSchema);
  if (response) return response;

  const member = await prisma.member.create({
    data: { ...data, status: data.status as PublishState },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "Member", entityId: member.id } });
  return ok(member, { status: 201 });
}
