import bcrypt from "bcryptjs";
import { z } from "zod";

import { error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

export async function PUT(request: Request) {
  const session = await requireAdminApi();
  if (!session?.user?.id) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      email: data.email,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  return ok({ saved: true });
}
