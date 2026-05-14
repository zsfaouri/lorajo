import bcrypt from "bcryptjs";

import { error, ok, parseJson, requirePrisma } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { data, response } = await parseJson(request, loginSchema);
  if (response) return response;

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const user = await prisma.user.findUnique({ where: { email: data.email }, include: { role: true } });
  if (!user?.passwordHash) return error("Invalid credentials", 401);

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) return error("Invalid credentials", 401);

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name ?? (user.email === process.env.ADMIN_EMAIL ? "admin" : null),
    },
  });
}
