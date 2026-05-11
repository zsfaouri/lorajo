import { z } from "zod";

import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({
  items: z.array(
    z.object({
      locale: z.enum(["EN", "AR"]),
      label: z.string().min(1),
      path: z.string().min(1),
      sortOrder: z.number().int(),
      isVisible: z.boolean().default(true),
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
    prisma.navigationItem.deleteMany({}),
    ...data.items.map((item) => prisma.navigationItem.create({ data: item })),
  ]);

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "replace", entity: "NavigationItem", after: auditPayload(data) },
  });

  return ok({ saved: true });
}
