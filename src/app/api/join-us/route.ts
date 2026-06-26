import sanitizeHtml from "sanitize-html";

import { error, ok, parseJson, requirePrisma, jsonInput } from "@/lib/api-utils";
import { rateLimit, requestIp } from "@/lib/rate-limit";
import { membershipApplicationSchema } from "@/lib/validations";

const membershipLabels = {
  supporting: "Supporting Member / عضو مؤازر",
  honorary: "Honorary Member / عضو شرف",
  full: "Full Member / عضو عامل",
};

function clean(value: string | null | undefined) {
  return value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim() : "";
}

export async function POST(request: Request) {
  if (!rateLimit(`join-us:${requestIp(request)}`, 5, 60_000)) return error("Rate limit exceeded", 429);

  const { data, response } = await parseJson(request, membershipApplicationSchema);
  if (response) return response;

  const application = {
    name: clean(data.name),
    birthYear: clean(data.birthYear),
    postalAddress: clean(data.postalAddress),
    mobile: clean(data.mobile),
    email: clean(data.email),
    website: clean(data.website),
    profession: clean(data.profession),
    hobbies: clean(data.hobbies),
    relationToJabalLuweibdeh: clean(data.relationToJabalLuweibdeh),
    applicationYear: clean(data.applicationYear),
    recommendationOneName: clean(data.recommendationOneName),
    recommendationTwoName: clean(data.recommendationTwoName),
    membershipType: data.membershipType,
  };

  const lines = [
    "Membership Application Form",
    "",
    `Name: ${application.name}`,
    `Date of Birth Year: ${application.birthYear}`,
    `Postal Address: ${application.postalAddress}`,
    `Mobile: ${application.mobile}`,
    `Email: ${application.email}`,
    `Website: ${application.website || "-"}`,
    `Profession: ${application.profession || "-"}`,
    `Hobbies: ${application.hobbies || "-"}`,
    `Relation to Jabal Luweibdeh: ${application.relationToJabalLuweibdeh}`,
    `Application Year: ${application.applicationYear}`,
    `Recommendation 1 Name: ${application.recommendationOneName || "-"}`,
    `Recommendation 2 Name: ${application.recommendationTwoName || "-"}`,
    `Membership Type: ${membershipLabels[application.membershipType]}`,
  ];

  const prisma = requirePrisma();
  let saved: { id: string } | null = null;

  if (prisma) {
    try {
      saved = await prisma.contactMessage.create({
          data: {
            name: application.name,
            email: application.email,
            phone: application.mobile,
            subject: "Membership application",
            message: lines.join("\n"),
            metadata: jsonInput({ type: "membership_application", application }),
          },
        });
    } catch (caught) {
      console.error("[join-us] Could not save membership application", caught);
      return error("Database is unavailable. Application could not be saved.", 503);
    }
  }

  return ok({ received: true, id: saved?.id ?? null });
}
