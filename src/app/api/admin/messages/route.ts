import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  return withAdmin(async ({ prisma }) => {
    return prisma.contactMessage.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
    });
  });
}
