import { NextRequest } from "next/server";
import { withAdmin, parseBody, slugify, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    return prisma.member.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { mediaAsset: true },
    });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      name: string;
      slug?: string;
      title?: string;
      bio?: any;
      sortOrder?: number;
      isFounder?: boolean;
      status?: string;
      mediaAssetId?: string;
    }>(req);

    const slug = body.slug || slugify(body.name);

    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const last = await prisma.member.findFirst({
        where: { locale: body.locale as any },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    const member = await prisma.member.create({
      data: {
        locale: body.locale as any,
        name: body.name,
        slug,
        title: body.title,
        bio: body.bio,
        sortOrder,
        isFounder: body.isFounder ?? false,
        status: (body.status as any) || "DRAFT",
        mediaAssetId: body.mediaAssetId,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "Member", entityId: member.id, after: member, metadata: { email } });
    return member;
  });
}
