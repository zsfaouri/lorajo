import { SectionRenderer } from "@/components/cms/section-renderer";
import type { CmsPage } from "@/types/cms";

export async function DynamicPage({ page }: { page: CmsPage }) {
  const sections = [...page.sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const rendered = await Promise.all(
    sections.map((section) => <SectionRenderer key={section.id} section={section} locale={page.locale} />),
  );

  return <>{rendered}</>;
}
