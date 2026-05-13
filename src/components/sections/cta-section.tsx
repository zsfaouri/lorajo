import Link from "next/link";

import { SectionFrame } from "@/components/sections/section-frame";
import { cta, text } from "@/components/sections/section-content";
import type { CmsSection } from "@/types/cms";

export function CtaSection({ section }: { section: CmsSection }) {
  const action = cta(section.content);

  return (
    <SectionFrame section={section} className="bg-[var(--color-black)] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(2.4rem,6vw,5rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9]">
            {text(section.content, "title", "Call to action")}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">{text(section.content, "body")}</p>
        </div>
        {action ? (
          <Link href={action.href} className="inline-flex h-12 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-heritage-green)] px-6 text-sm font-medium text-white">
            {action.label}
          </Link>
        ) : null}
      </div>
    </SectionFrame>
  );
}
