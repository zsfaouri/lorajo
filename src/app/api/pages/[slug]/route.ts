import { getPageBySlug } from "@/lib/cms-data";
import { normalizeLocale } from "@/lib/cms-constants";
import { error, ok } from "@/lib/api-utils";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale") ?? "en");
  const page = await getPageBySlug(locale, slug || "home");

  if (!page) return error("Page not found", 404);
  return ok(page);
}
