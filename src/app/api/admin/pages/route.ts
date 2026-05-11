import { PublishState } from "@prisma/client";

import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { pageSchema } from "@/lib/validations";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  return ok(await prisma.page.findMany({ include: { sections: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ locale: "asc" }, { slug: "asc" }] }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, pageSchema);
  if (response) return response;

  const page = await prisma.page.create({
    data: {
      ...data,
      status: data.status as PublishState,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "create", entity: "Page", entityId: page.id, after: auditPayload(page) },
  });

  return ok(page, { status: 201 });
}
