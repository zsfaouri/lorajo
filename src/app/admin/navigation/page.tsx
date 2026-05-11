import { NavigationFormEditor } from "@/components/admin/navigation-form-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { fallbackNavigation } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

export default async function AdminNavigationPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const items = prisma
    ? await prisma.navigationItem.findMany({ orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] })
    : [...fallbackNavigation.en.map((item) => ({ ...item, locale: "EN" })), ...fallbackNavigation.ar.map((item) => ({ ...item, locale: "AR" }))];

  return (
    <NavigationFormEditor
      initialItems={items.map((item) => ({
        locale: item.locale === "AR" ? "AR" : "EN",
        label: item.label,
        path: item.path,
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
      }))}
    />
  );
}
