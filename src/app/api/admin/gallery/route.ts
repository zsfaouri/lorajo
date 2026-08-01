import { NextRequest } from "next/server";
import { withAdmin, parseBody, slugify, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    const collections = await prisma.galleryCollection.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { images: true } } },
    });
    return collections.map((c: any) => ({
      ...c,
      imageCount: c._count.images,
      _count: undefined,
    }));
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      title: string;
      slug?: string;
      description?: string;
      driveFolderId?: string;
      sortOrder?: number;
      status?: string;
    }>(req);

    const slug = body.slug || slugify(body.title);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.galleryCollection.findFirst({
        where: { locale: body.locale as any },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    const collection = await prisma.galleryCollection.create({
      data: {
        locale: body.locale as any,
        title: body.title,
        slug,
        description: body.description,
        driveFolderId: body.driveFolderId,
        sortOrder,
        status: (body.status as any) || "DRAFT",
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "GalleryCollection", entityId: collection.id, after: collection, metadata: { email } });
    return collection;
  });
}
