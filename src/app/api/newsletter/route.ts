import { error, ok, parseJson, requirePrisma } from "@/lib/api-utils";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!rateLimit(`newsletter:${requestIp(request)}`, 8, 60_000)) return error("Rate limit exceeded", 429);

  const { data, response } = await parseJson(request, newsletterSchema);
  if (response) return response;

  const prisma = requirePrisma();
  const saved = prisma
    ? await prisma.newsletterSubscriber.upsert({
        where: { email: data.email },
        update: { name: data.name, locale: data.locale ?? undefined, consent: true },
        create: { email: data.email, name: data.name, locale: data.locale ?? undefined, consent: true },
      })
    : null;

  return ok({ subscribed: true, id: saved?.id ?? null });
}
