import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.article.findUniqueOrThrow({
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
    const before = await prisma.article.findUniqueOrThrow({ where: { id } });
    const body = await parseBody<Record<string, any>>(req);
    if (body.publishedAt) body.publishedAt = new Date(body.publishedAt);
    const article = await prisma.article.update({ where: { id }, data: body });
    await logAudit(prisma, { action: "UPDATE", entity: "Article", entityId: id, before, after: article, metadata: { email } });
    return article;
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma, email }) => {
    const before = await prisma.article.findUniqueOrThrow({ where: { id } });
    await prisma.article.delete({ where: { id } });
    await logAudit(prisma, { action: "DELETE", entity: "Article", entityId: id, before, metadata: { email } });
    return { deleted: true };
  });
}
