import { PublishState } from "@prisma/client";

import { error, ok, requirePrisma } from "@/lib/api-utils";

export async function GET() {
  const prisma = requirePrisma();
  if (!prisma) return ok([]);

  try {
    return ok(await prisma.project.findMany({ where: { status: PublishState.PUBLISHED }, orderBy: { createdAt: "desc" } }));
  } catch {
    return error("Unable to load projects", 500);
  }
}
