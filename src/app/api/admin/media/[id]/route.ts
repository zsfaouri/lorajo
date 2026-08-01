import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    const asset = await prisma.mediaAsset.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "MediaAsset", entityId: id, before, after: asset, metadata: { email } });
    return asset;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    await prisma.mediaAsset.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "MediaAsset", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
