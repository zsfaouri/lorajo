import { auditPayload, error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { themeSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);

  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);

  const { data, response } = await parseJson(request, themeSchema);
  if (response) return response;

  const theme = await prisma.siteTheme.findFirst({ where: { isActive: true } });
  const saved = theme
    ? await prisma.siteTheme.update({ where: { id: theme.id }, data: { tokens: jsonInput(data.tokens) } })
    : await prisma.siteTheme.create({ data: { name: "LORA Theme", isActive: true, tokens: jsonInput(data.tokens) } });

  await prisma.auditLog.create({
    data: { userId: session.user?.id, action: "update", entity: "SiteTheme", entityId: saved.id, after: auditPayload(data.tokens) },
  });

  return ok(saved);
}
