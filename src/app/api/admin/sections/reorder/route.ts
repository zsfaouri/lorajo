import { auditPayload, error, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { sectionReorderSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, sectionReorderSchema);
  if (response) return response;

  await prisma.$transaction(
    data.sectionIds.map((id, index) =>
      prisma.pageSection.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "reorder", entity: "PageSection", after: auditPayload({ sectionIds: data.sectionIds }) },
  });

  return ok({ reordered: true });
}
