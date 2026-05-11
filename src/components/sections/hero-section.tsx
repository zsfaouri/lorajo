import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HeroScrubSection } from "@/components/sections/hero-scrub-section";
import { SectionFrame } from "@/components/sections/section-frame";
import { cta, imageSrc, logoSrc, text } from "@/components/sections/section-content";
import { Reveal } from "@/components/sections/reveal";
import type { CmsSection } from "@/types/cms";

export function HeroSection({ section }: { section: CmsSection }) {
  if (section.variant === "split_text_image") return <SplitHero section={section} />;
  if (section.variant === "centered_minimal") return <CenteredHero section={section} />;
  if (section.variant === "editorial_fullscreen") return <HeroScrubSection section={section} />;
  return <EditorialHero section={section} />;
}

function EditorialHero({ section }: { section: CmsSection }) {
  const content = section.content;
  const action = cta(content);

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-[var(--color-black)] px-[var(--space-page-x)] pb-12 pt-28 text-white">
      <Image
        src={imageSrc(content)}
        alt={text(content, "tagline", "LORA heritage image")}
        fill
        className="object-cover opacity-62 saturate-[0.82]"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.86),rgba(10,10,10,0.42),rgba(10,10,10,0.18))]" />
      <div className="relative mx-auto flex min-h-[calc(92svh-7rem)] max-w-7xl flex-col justify-end">
        <Reveal className="max-w-4xl">
          <Image
            src={logoSrc(content)}
            alt="LORA logo"
            width={86}
            height={86}
            className="mb-10 rounded-full bg-white/90 p-1"
            priority
          />
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-white/62">{text(content, "eyebrow")}</p>
          <h1 className="max-w-4xl text-[clamp(4.8rem,15vw,12rem)] font-[var(--font-heading-weight)] leading-[0.82]">
            {text(content, "title", "LORA")}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-white/76 md:text-2xl">{text(content, "subtitle")}</p>
          <p className="mt-8 text-sm uppercase tracking-[0.18em] text-[var(--color-jasmine)]">{text(content, "tagline")}</p>
          <p className="mt-8 max-w-xl text-base leading-8 text-white/68">{text(content, "body")}</p>
          {action ? (
            <Button asChild variant="outline" className="mt-10 border-white/45 text-white hover:border-[var(--color-heritage-green)]">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

function CenteredHero({ section }: { section: CmsSection }) {
  return (
    <SectionFrame section={section} className="pt-36">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-heritage-green)]">
          {text(section.content, "subtitle")}
        </p>
        <h1 className="text-[clamp(3rem,9vw,8rem)] font-[var(--font-heading-weight)] leading-none">
          {text(section.content, "title")}
        </h1>
      </Reveal>
    </SectionFrame>
  );
}

function SplitHero({ section }: { section: CmsSection }) {
  return (
    <SectionFrame section={section} className="pt-32">
      <div className="mx-auto grid max-w-7xl items-end gap-10 md:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-heritage-green)]">LORA</p>
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-[var(--font-heading-weight)] leading-[0.92]">
            {text(section.content, "title")}
          </h1>
        </Reveal>
        <Reveal delay={0.12} className="relative aspect-[5/4] overflow-hidden rounded-[var(--radius-media)]">
          <Image src={imageSrc(section.content)} alt={text(section.content, "title")} fill className="object-cover" />
        </Reveal>
      </div>
    </SectionFrame>
  );
}
