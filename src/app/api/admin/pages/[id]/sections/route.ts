import { NextRequest } from "next/server";
import { withAdmin, parseBody } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    return prisma.pageSection.findMany({
      where: { pageId: id },
      orderBy: { sortOrder: "asc" },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAdmin(async ({ prisma }) => {
    const body = await parseBody<{
      type: string;
      variant: string;
      content: any;
      settings: any;
      sortOrder?: number;
      isVisible?: boolean;
      spacing?: any;
      background?: any;
      alignment?: string;
    }>(req);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.pageSection.findFirst({
        where: { pageId: id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    return prisma.pageSection.create({
      data: {
        pageId: id,
        type: body.type,
        variant: body.variant,
        content: body.content,
        settings: body.settings,
        sortOrder,
        isVisible: body.isVisible ?? true,
        spacing: body.spacing,
        background: body.background,
        alignment: body.alignment,
      },
    });
  });
}
