import sanitizeHtml from "sanitize-html";

import { getResend } from "@/lib/email";
import { error, ok, parseJson, requirePrisma } from "@/lib/api-utils";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!rateLimit(`contact:${requestIp(request)}`, 5, 60_000)) return error("Rate limit exceeded", 429);

  const { data, response } = await parseJson(request, contactSchema);
  if (response) return response;

  const clean = {
    ...data,
    name: sanitizeHtml(data.name, { allowedTags: [], allowedAttributes: {} }),
    subject: data.subject ? sanitizeHtml(data.subject, { allowedTags: [], allowedAttributes: {} }) : null,
    message: sanitizeHtml(data.message, { allowedTags: [], allowedAttributes: {} }),
  };

  const prisma = requirePrisma();
  const saved = prisma ? await prisma.contactMessage.create({ data: clean }) : null;

  const resend = getResend();
  if (resend && process.env.CONTACT_TO_EMAIL) {
    await resend.emails.send({
      from: "LORA Website <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL,
      subject: clean.subject ?? "New LORA contact message",
      text: `${clean.name} <${clean.email}>\n\n${clean.message}`,
    });
  }

  return ok({ received: true, id: saved?.id ?? null });
}
