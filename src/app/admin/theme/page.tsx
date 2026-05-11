import { ThemeFormEditor } from "@/components/admin/theme-form-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { getActiveTheme } from "@/lib/cms-data";

export default async function ThemeStudioPage() {
  await requireAdmin();
  const theme = await getActiveTheme();

  return <ThemeFormEditor initialTheme={theme} />;
}
