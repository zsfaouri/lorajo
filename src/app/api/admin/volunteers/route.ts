import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  return withAdmin(async ({ prisma }) => {
    return prisma.volunteerApplication.findMany({
      orderBy: { id: "desc" },
    });
  });
}
