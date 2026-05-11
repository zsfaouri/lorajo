import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { sectionSchema } from "@/lib/validations";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { id } = await context.params;
  const { data, response } = await parseJson(request, sectionSchema);
  if (response) return response;

  const section = await prisma.pageSection.create({
    data: {
      pageId: id,
      type: data.type,
      variant: data.variant,
      sortOrder: data.sortOrder,
      isVisible: data.isVisible,
      content: jsonInput(data.content),
      settings: jsonInput(data.settings),
      spacing: data.spacing ? jsonInput(data.spacing) : undefined,
      background: data.background ? jsonInput(data.background) : undefined,
      alignment: data.alignment,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "create", entity: "PageSection", entityId: section.id },
  });

  return ok(section, { status: 201 });
}
