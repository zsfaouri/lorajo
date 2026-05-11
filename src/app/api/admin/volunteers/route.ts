import { error, ok, requireAdminApi, requirePrisma } from "@/lib/api-utils";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.volunteerApplication.findMany({ orderBy: { createdAt: "desc" } }));
}
