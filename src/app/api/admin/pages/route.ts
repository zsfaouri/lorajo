import { NextRequest } from "next/server";
import { withAdmin, parseBody, slugify, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    const pages = await prisma.page.findMany({
      where: locale ? { locale: locale as any } : undefined,
      select: {
        id: true,
        locale: true,
        slug: true,
        title: true,
        status: true,
        updatedAt: true,
        _count: { select: { sections: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return pages.map((p: any) => ({
      ...p,
      sectionCount: p._count.sections,
      _count: undefined,
    }));
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      slug?: string;
      title: string;
      seoTitle?: string;
      seoDescription?: string;
      status?: string;
    }>(req);
    const slug = body.slug || slugify(body.title);
    const page = await prisma.page.create({
      data: {
        locale: body.locale as any,
        slug,
        title: body.title,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        status: (body.status as any) || "DRAFT",
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "Page", entityId: page.id, after: page, metadata: { email } });
    return page;
  });
}
