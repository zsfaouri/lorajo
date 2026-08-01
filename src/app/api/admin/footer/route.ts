import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    return prisma.footerColumn.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { sortOrder: "asc" },
    });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      title: string;
      sortOrder?: number;
      content: any;
      links: any;
    }>(req);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.footerColumn.findFirst({
        where: { locale: body.locale as any },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    const col = await prisma.footerColumn.create({
      data: {
        locale: body.locale as any,
        title: body.title,
        sortOrder,
        content: body.content,
        links: body.links,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "FooterColumn", entityId: col.id, after: col, metadata: { email } });
    return col;
  });
}
