import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function PUT(req: NextRequest) {
  return withAdmin(async ({ prisma }) => {
    const { locale, orderedIds } = await parseBody<{ locale: string; orderedIds: string[] }>(req);
    await Promise.all(
      orderedIds.map((id: string, i: number) =>
        prisma.navigationItem.update({ where: { id }, data: { sortOrder: i } }),
      ),
    );
    return { reordered: true };
  });
}
