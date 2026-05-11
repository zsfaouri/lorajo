import { FooterFormEditor } from "@/components/admin/footer-form-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { fallbackFooter } from "@/lib/fallback-data";
import { getPrisma } from "@/lib/prisma";

export default async function AdminFooterPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const columns = prisma
    ? await prisma.footerColumn.findMany({ orderBy: [{ locale: "asc" }, { sortOrder: "asc" }] })
    : [...fallbackFooter.en.map((item) => ({ ...item, locale: "EN" })), ...fallbackFooter.ar.map((item) => ({ ...item, locale: "AR" }))];

  return (
    <FooterFormEditor
      initialColumns={columns.map((column) => ({
        locale: column.locale === "AR" ? "AR" : "EN",
        title: column.title,
        sortOrder: column.sortOrder,
        content: typeof column.content === "object" && column.content && !Array.isArray(column.content) ? column.content : {},
        links: Array.isArray(column.links)
          ? column.links
              .filter((item) => typeof item === "object" && item && !Array.isArray(item))
              .map((item) => item as Record<string, unknown>)
          : [],
      }))}
    />
  );
}
