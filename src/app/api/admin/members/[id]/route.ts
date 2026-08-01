import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.member.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const member = await prisma.member.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "Member", entityId: id, before, after: member, metadata: { email } });
    return member;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.member.findUniqueOrThrow({ where: { id } });
    await prisma.member.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "Member", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
