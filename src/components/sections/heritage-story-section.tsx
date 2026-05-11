import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/sections/reveal";
import { SectionFrame } from "@/components/sections/section-frame";
import { cta, imageSrc, text } from "@/components/sections/section-content";
import { Button } from "@/components/ui/button";
import type { CmsSection } from "@/types/cms";

export function HeritageStorySection({ section }: { section: CmsSection }) {
  const action = cta(section.content);

  return (
    <SectionFrame section={section}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="relative order-2 lg:order-1">
          <div className="absolute -left-5 -top-5 hidden h-40 w-40 border border-[var(--color-stone)] md:block" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-media)]">
            <Image
              src={imageSrc(section.content, "/lora/gallery/square-de-paris.jpg")}
              alt={text(section.content, "title", "LORA heritage story")}
              fill
              className="object-cover grayscale-[0.18]"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">
            {text(section.content, "label")}
          </p>
          <h2 className="max-w-2xl text-[clamp(2.4rem,6vw,5.6rem)] font-[var(--font-heading-weight)] leading-[0.95]">
            {text(section.content, "title")}
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-8 text-black/68">{text(section.content, "body")}</p>
          {action ? (
            <Button asChild variant="outline" className="mt-9">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
        </Reveal>
      </div>
    </SectionFrame>
  );
}
