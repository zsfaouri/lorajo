import { NextRequest } from "next/server";
import { withAdmin, parseBody, slugify, logAudit } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale");
  return withAdmin(async ({ prisma }) => {
    return prisma.article.findMany({
      where: locale ? { locale: locale as any } : undefined,
      orderBy: { publishedAt: "desc" },
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
      excerpt?: string;
      content?: any;
      author?: string;
      driveFolderId?: string;
      status?: string;
      publishedAt?: string;
      mediaAssetId?: string;
    }>(req);

    const slug = body.slug || slugify(body.title);
    const article = await prisma.article.create({
      data: {
        locale: body.locale as any,
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content: body.content ?? {},
        author: body.author,
        driveFolderId: body.driveFolderId,
        status: (body.status as any) || "DRAFT",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        mediaAssetId: body.mediaAssetId,
      },
    });
    await logAudit(prisma, { action: "CREATE", entity: "Article", entityId: article.id, after: article, metadata: { email } });
    return article;
  });
}
