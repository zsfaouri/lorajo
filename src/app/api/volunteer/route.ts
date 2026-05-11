import sanitizeHtml from "sanitize-html";

import { error, jsonInput, ok, parseJson, requirePrisma } from "@/lib/api-utils";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { volunteerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!rateLimit(`volunteer:${requestIp(request)}`, 5, 60_000)) return error("Rate limit exceeded", 429);

  const { data, response } = await parseJson(request, volunteerSchema);
  if (response) return response;

  const clean = {
    ...data,
    name: sanitizeHtml(data.name, { allowedTags: [], allowedAttributes: {} }),
    message: data.message ? sanitizeHtml(data.message, { allowedTags: [], allowedAttributes: {} }) : null,
  };

  const prisma = requirePrisma();
  const saved = prisma
    ? await prisma.volunteerApplication.create({ data: { ...clean, interests: jsonInput(clean.interests) } })
    : null;
  return ok({ received: true, id: saved?.id ?? null });
}
