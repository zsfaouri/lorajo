import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    return prisma.navigationItem.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { children: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      label: string;
      path: string;
      sortOrder?: number;
      isVisible?: boolean;
      parentId?: string;
    }>(req);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.navigationItem.findFirst({
        where: { locale: body.locale as any, parentId: body.parentId ?? null },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    const item = await prisma.navigationItem.create({
      data: {
        locale: body.locale as any,
        label: body.label,
        path: body.path,
        sortOrder,
        isVisible: body.isVisible ?? true,
        parentId: body.parentId,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "NavigationItem", entityId: item.id, after: item, metadata: { email } });
    return item;
  });
}
