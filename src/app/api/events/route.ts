import { PublishState } from "@prisma/client";

import { error, ok, requirePrisma } from "@/lib/api-utils";

export async function GET() {
  const prisma = requirePrisma();
  if (!prisma) return ok([]);

  try {
    return ok(await prisma.event.findMany({ where: { status: PublishState.PUBLISHED }, orderBy: { startsAt: "asc" } }));
  } catch {
    return error("Unable to load events", 500);
  }
}
