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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  const { data, response } = await parseJson(request, eventSchema.partial());
  if (response) return response;

  const { imageUrl, imageAlt, videoUrl, invitationUrl, actionLabel, content, ...eventData } = data;
  const nextContent =
    content || imageUrl || imageAlt || videoUrl || invitationUrl || actionLabel
      ? {
          ...(content ?? {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(imageAlt ? { imageAlt } : {}),
          ...(videoUrl ? { videoUrl } : {}),
          ...(invitationUrl ? { invitationUrl } : {}),
          ...(actionLabel ? { actionLabel } : {}),
        }
      : undefined;

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...eventData,
      content: nextContent ? jsonInput(nextContent) : undefined,
      status: eventData.status as PublishState | undefined,
      startsAt: eventData.startsAt ? new Date(eventData.startsAt) : undefined,
      endsAt: eventData.endsAt ? new Date(eventData.endsAt) : undefined,
    },
  });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "update", entity: "Event", entityId: id } });
  return ok(event);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return error("Unauthorized", 401);
  const prisma = requirePrisma();
  if (!prisma) return error("Database is not configured", 503);
  const { id } = await context.params;
  await prisma.event.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId: session.user?.id, action: "delete", entity: "Event", entityId: id } });
  return ok({ deleted: true });
}
