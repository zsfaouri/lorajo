import { z } from "zod";

import { auditPayload, error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({
  columns: z.array(
    z.object({
      locale: z.enum(["EN", "AR"]),
      title: z.string().min(1),
      sortOrder: z.number().int(),
      content: z.record(z.string(), z.unknown()).default({}),
      links: z.array(z.record(z.string(), z.unknown())).default([]),
    }),
  ),
});

export async function PUT(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  await prisma.$transaction([
    prisma.footerColumn.deleteMany({}),
    ...data.columns.map((column) =>
      prisma.footerColumn.create({
        data: { ...column, content: jsonInput(column.content), links: jsonInput(column.links) },
      }),
    ),
  ]);

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "replace", entity: "FooterColumn", after: auditPayload(data) },
  });

  return ok({ saved: true });
}
