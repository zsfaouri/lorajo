import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const { sectionId } = await params;
  return withAdmin(async ({ prisma }) => {
    const body = await parseBody<Record<string, any>>(req);
    return prisma.pageSection.update({ where: { id: sectionId }, data: body });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const { id, sectionId } = await params;
  return withAdmin(async ({ prisma }) => {
    await prisma.pageSection.delete({ where: { id: sectionId } });
    const remaining = await prisma.pageSection.findMany({
      where: { pageId: id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await Promise.all(
      remaining.map((s: any, i: number) =>
        prisma.pageSection.update({ where: { id: s.id }, data: { sortOrder: i } }),
      ),
    );
    return { deleted: true };
  });
}
