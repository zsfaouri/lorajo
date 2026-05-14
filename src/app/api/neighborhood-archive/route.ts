import { getNeighborhoodArchiveItems } from "@/lib/cms-data";
import { normalizeLocale } from "@/lib/cms-constants";
import { ok } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return ok(await getNeighborhoodArchiveItems(normalizeLocale(searchParams.get("locale") ?? "en")));
}
