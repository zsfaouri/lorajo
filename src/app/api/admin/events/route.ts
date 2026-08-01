import { NextRequest } from "next/server";
import { withAdmin, parseBody, slugify, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    return prisma.event.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { startsAt: "desc" },
      include: { mediaAsset: true },
    });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      locale: string;
      title: string;
      slug?: string;
      summary?: string;
      content?: any;
      startsAt?: string;
      endsAt?: string;
      location?: string;
      driveFolderId?: string;
      status?: string;
      mediaAssetId?: string;
    }>(req);

    const slug = body.slug || slugify(body.title);
    const event = await prisma.event.create({
      data: {
        locale: body.locale as any,
        title: body.title,
        slug,
        summary: body.summary,
        content: body.content ?? {},
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        location: body.location,
        driveFolderId: body.driveFolderId,
        status: (body.status as any) || "DRAFT",
        mediaAssetId: body.mediaAssetId,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "Event", entityId: event.id, after: event, metadata: { email } });
    return event;
  });
}
