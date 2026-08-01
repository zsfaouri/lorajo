import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.page.findUniqueOrThrow({
      where: { id },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.page.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const page = await prisma.page.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "Page", entityId: id, before, after: page, metadata: { email } });
    return page;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.page.findUniqueOrThrow({ where: { id } });
    await prisma.page.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "Page", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
