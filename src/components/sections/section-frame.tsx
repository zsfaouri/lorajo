import { cn } from "@/lib/utils";
import type { CmsSection } from "@/types/cms";

const colorMap: Record<string, string> = {
  softWhite: "bg-[var(--color-soft-white)]",
  parchment: "bg-[var(--color-parchment)]",
  black: "bg-[var(--color-black)] text-white",
  stoneLight: "bg-[var(--color-stone-light)]",
  jasmine: "bg-[var(--color-jasmine)]",
};

function spacingClass(section: CmsSection) {
  const top = section.spacing?.top;
  const bottom = section.spacing?.bottom;
  if (top === "small" || bottom === "small") return "section-small";
  if (top === "medium" || bottom === "medium") return "section-medium";
  return "section-large";
}

export function SectionFrame({
  section,
  className,
  children,
}: {
  section: CmsSection;
  className?: string;
  children: React.ReactNode;
}) {
  const token = typeof section.background?.token === "string" ? section.background.token : "softWhite";

  return (
    <section className={cn("cms-section", spacingClass(section), colorMap[token] ?? colorMap.softWhite, className)}>
      {children}
    </section>
  );
}
