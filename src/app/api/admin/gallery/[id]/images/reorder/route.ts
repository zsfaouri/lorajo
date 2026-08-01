import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  return withAdmin(async ({ prisma }) => {
    const { orderedIds } = await parseBody<{ orderedIds: string[] }>(req);
    await Promise.all(
      orderedIds.map((id: string, i: number) =>
        prisma.galleryImage.update({ where: { id }, data: { sortOrder: i } }),
      ),
    );
    return { reordered: true };
  });
}
