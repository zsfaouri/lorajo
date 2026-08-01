import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.contactMessage.findUniqueOrThrow({ where: { id } });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<{ status: string }>(req);
    const msg = await prisma.contactMessage.update({
      where: { id },
      data: { status: body.status as any },
    });
    await logAudit(prisma, { action: "UPDATE", entity: "ContactMessage", entityId: id, before, after: msg, metadata: { email } });
    return msg;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
    await prisma.contactMessage.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "ContactMessage", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
