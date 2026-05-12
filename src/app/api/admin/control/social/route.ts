import { z } from "zod";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";

const schema = z.object({
  instagram: z.string().trim().optional().default(""),
  facebook: z.string().trim().optional().default(""),
  linkedin: z.string().trim().optional().default(""),
  x: z.string().trim().optional().default(""),
});

function mergeSocialLinks(content: unknown, socialLinks: z.infer<typeof schema>) {
  const record = content && typeof content === "object" && !Array.isArray(content) ? content : {};
  return {
    ...record,
    socialLinks,
  };
}

export async function PUT(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, schema);
  if (response) return response;

  const columns = await prisma.footerColumn.findMany();
  if (columns.length === 0) return error("Footer is not configured", 404);

  await prisma.$transaction(
    columns.map((column) =>
      prisma.footerColumn.update({
        where: { id: column.id },
        data: { content: jsonInput(mergeSocialLinks(column.content, data)) },
      }),
    ),
  );

  return ok({ saved: true });
}
