import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.event.findUniqueOrThrow({
      where: { id },
      include: { mediaAsset: true },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.event.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    if (body.startsAt) body.startsAt = new Date(body.startsAt);
    if (body.endsAt) body.endsAt = new Date(body.endsAt);
    const event = await prisma.event.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "Event", entityId: id, before, after: event, metadata: { email } });
    return event;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.event.findUniqueOrThrow({ where: { id } });
    await prisma.event.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "Event", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
