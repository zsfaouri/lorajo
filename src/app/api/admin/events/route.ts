import { PublishState } from "@prisma/client";
import { z } from "zod";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { contentEntrySchema } from "@/lib/validations";

const eventSchema = contentEntrySchema.extend({
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  return ok(await prisma.event.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { data, response } = await parseJson(request, eventSchema);
  if (response) return response;

  const event = await prisma.event.create({
    data: {
      ...data,
      content: jsonInput(data.content),
      status: data.status as PublishState,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "Event", entityId: event.id } });
  return ok(event, { status: 201 });
}
