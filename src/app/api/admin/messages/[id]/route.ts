import { z } from "zod";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({ status: z.enum(["NEW", "READ", "ARCHIVED"]) });

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  return ok(await prisma.contactMessage.update({ where: { id }, data }));
}
