import { PublishState } from "@prisma/client";
import { z } from "zod";

import { error, jsonInput, ok, parseJson, requireAdminApi, requirePrisma } from "@/lib/api-utils";
import { contentEntrySchema } from "@/lib/validations";

const eventSchema = contentEntrySchema.extend({
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  imageUrl: z.string().min(1).optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  invitationUrl: z.string().optional().nullable(),
  actionLabel: z.string().optional().nullable(),
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

  const { imageUrl, imageAlt, videoUrl, invitationUrl, actionLabel, content, ...eventData } = data;
  const event = await prisma.event.create({
    data: {
      ...eventData,
      content: jsonInput({
        ...content,
        ...(imageUrl ? { imageUrl } : {}),
        ...(imageAlt ? { imageAlt } : {}),
        ...(videoUrl ? { videoUrl } : {}),
        ...(invitationUrl ? { invitationUrl } : {}),
        ...(actionLabel ? { actionLabel } : {}),
      }),
      status: eventData.status as PublishState,
      startsAt: eventData.startsAt ? new Date(eventData.startsAt) : null,
      endsAt: eventData.endsAt ? new Date(eventData.endsAt) : null,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "create", entity: "Event", entityId: event.id } });
  return ok(event, { status: 201 });
}
