import { z } from "zod";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({
  roleId: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await params;
  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  if (data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: data.roleId }, select: { id: true } });
    if (!role) return error("Role not found", 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { roleId: data.roleId ?? null },
    include: { role: true },
  });

  return ok(user);
}
