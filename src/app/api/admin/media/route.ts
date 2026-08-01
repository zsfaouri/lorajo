import { NextRequest } from "next/server";
import { withAdmin, parseBody, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20", 10)));
  const type = sp.get("type");

  return withAdmin(async ({ prisma }) => {
    const where = type ? { type: type as any } : undefined;
    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mediaAsset.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async ({ prisma, email }) => {
    const body = await parseBody<{
      type: string;
      url: string;
      alt?: string;
      caption?: string;
      width?: number;
      height?: number;
      source?: string;
      key?: string;
    }>(req);
    const asset = await prisma.mediaAsset.create({
      data: {
        type: body.type as any,
        url: body.url,
        alt: body.alt,
        caption: body.caption,
        width: body.width,
        height: body.height,
        source: body.source,
        key: body.key,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "MediaAsset", entityId: asset.id, after: asset, metadata: { email } });
    return asset;
  });
}
