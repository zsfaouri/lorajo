import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.navigationItem.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const item = await prisma.navigationItem.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "NavigationItem", entityId: id, before, after: item, metadata: { email } });
    return item;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.navigationItem.findUniqueOrThrow({ where: { id } });
    await prisma.navigationItem.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "NavigationItem", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
