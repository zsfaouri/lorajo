import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.volunteerApplication.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<{ status: string }>(req);
    const app = await prisma.volunteerApplication.update({
      where: { id },
      data: { status: body.status as any },
    });
    await logAudit(prisma, { action: "UPDATE", entity: "VolunteerApplication", entityId: id, before, after: app, metadata: { email } });
    return app;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.volunteerApplication.findUniqueOrThrow({ where: { id } });
    await prisma.volunteerApplication.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "VolunteerApplication", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
