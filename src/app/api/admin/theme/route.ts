import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET() {
  return withAdmin(async ({ prisma }) => {
    return prisma.siteTheme.findFirstOrThrow({
      where: { isActive: true },
      include: { designTokens: true },
    });
  });
}

export async function PUT(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const { tokens } = await parseBody<{ tokens: Record<string, any> }>(req);
    const active = await prisma.siteTheme.findFirstOrThrow({ where: { isActive: true } });
    const before = { tokens: active.tokens };
    const theme = await prisma.siteTheme.update({
      where: { id: active.id },
      data: { tokens },
      include: { designTokens: true },
    });
    await logAudit(prisma, { action: "UPDATE", entity: "SiteTheme", entityId: active.id, before, after: { tokens }, metadata: { email } });
    return theme;
  });
}
