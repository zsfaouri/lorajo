import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.footerColumn.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const col = await prisma.footerColumn.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "FooterColumn", entityId: id, before, after: col, metadata: { email } });
    return col;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.footerColumn.findUniqueOrThrow({ where: { id } });
    await prisma.footerColumn.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "FooterColumn", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
