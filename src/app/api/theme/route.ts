import { getActiveTheme } from "@/lib/cms-data";
import { ok } from "@/lib/api-utils";

export async function GET() {
  return ok(await getActiveTheme());
}
