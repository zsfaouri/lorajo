import Image from "next/image";
import Link from "next/link";

import { FounderFlipCard } from "@/components/cms/founder-flip-card";
import { LoraScrollRuntime } from "@/components/cms/lora-scroll-runtime";
import type { CmsImage, CmsPage, LocaleCode, MemberDto } from "@/types/cms";

type Props = {
  locale: LocaleCode;
  whoPage: CmsPage;
  whatPage: CmsPage | null;
  members: MemberDto[];
};

function body(content: Record<string, unknown> | undefined) {
  const value = content?.body;
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function text(content: Record<string, unknown> | undefined, key: string, fallback = "") {
  const value = content?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function cta(content: Record<string, unknown> | undefined) {
  const value = content?.cta;
  if (!value || typeof value !== "object" || Array.isArray(value)) return { label: "", href: "" };
  const record = value as Record<string, unknown>;
  return {
    label: typeof record.label === "string" ? record.label : "",
    href: typeof record.href === "string" ? record.href : "",
  };
}

function section(page: CmsPage | null | undefined, type: string, variant?: string) {
  return page?.sections.find((item) => item.type === type && (!variant || item.variant === variant));
}

function images(content: Record<string, unknown> | undefined): CmsImage[] {
  const value = content?.images;
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      src: typeof item.src === "string" ? item.src : "/lora/gallery/square-de-paris.jpg",
      alt: typeof item.alt === "string" ? item.alt : "LORA image",
      caption: typeof item.caption === "string" ? item.caption : undefined,
    }))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.src === item.src) === index);
}

const fallbackImages: CmsImage[] = [
  { src: "/lora/gallery/luweibdeh-flower.jpg", alt: "Luweibdeh flower", caption: "Local memory" },
  { src: "/lora/gallery/square-de-paris.jpg", alt: "Paris Square", caption: "Public space" },
  { src: "/lora/gallery/dar-al-anda-art-gallery.jpg", alt: "Dar Al-Anda", caption: "Cultural activity" },
  { src: "/lora/gallery/blue-house-4.jpg", alt: "Blue House", caption: "Historical architecture" },
  { src: "/lora/gallery/alsaadi-mosque.jpg", alt: "Al Saadi Mosque", caption: "Heritage landmark" },
  { src: "/lora/gallery/luzmila-hospital.jpg", alt: "Luzmila Hospital", caption: "Neighborhood landmark" },
];

export function MergedWhoWeArePage({ locale, whoPage, whatPage, members }: Props) {
  const hero = section(whoPage, "hero");
  const whoBody = section(whoPage, "rich_text");
  const whatBody = section(whatPage, "rich_text") ?? section(whatPage, "hero");
  const whoParagraphs = body(whoBody?.content);
  const whatParagraphs = body(whatBody?.content);
  const gallery = images(whatBody?.content).length ? images(whatBody?.content) : fallbackImages;
  const visibleMembers = members.slice(0, 12);
  const isArabic = locale === "ar";
  const ctaBase = `/${locale}`;
  const heroTitle = "L.O.R.A";
  const heroTagline = text(hero?.content, "tagline", "luweibdeh old residents association");
  const heroSubtitle = text(hero?.content, "subtitle", "luweibdeh old residents association");
  const heroPrimary = cta(hero?.content);
  const identityTitle = text(whoBody?.content, "title", "A neighborhood association for memory, care, and continuity.");
  const identitySubtitle = text(whoBody?.content, "subtitle", "Who we are / What we do / Founding members");
  const workTitle = text(whatBody?.content, "title", "Protecting heritage while keeping the neighborhood alive.");
  const workSubtitle = text(whatBody?.content, "subtitle", "LORA strengthens belonging, protects shared heritage, and supports practical community initiatives.");

  return (
    <main className="lora-merged" dir={isArabic ? "rtl" : "ltr"}>
      <LoraScrollRuntime />
      <div className="lora-merged-bg" aria-hidden="true"><div className="lora-merged-bg__image" /></div>

      <section className="lora-merged-hero" id="top">
        <div className="lora-merged-hero__media">
          <Image src={gallery[0]?.src ?? "/lora/gallery/luweibdeh-flower.jpg"} alt={gallery[0]?.alt ?? "Luweibdeh"} fill className="lora-merged-hero__image" priority sizes="100vw" />
        </div>
        <div className="lora-merged-hero__inner">
          <p className="lora-merged-eyebrow lora-merged-reveal">{heroTagline}</p>
          <h1 className="lora-merged-hero__title lora-merged-reveal"><span>{heroTitle}</span></h1>
          <p className="lora-merged-hero__sub lora-merged-reveal">{heroSubtitle}</p>
          <div className="lora-merged-actions lora-merged-reveal"><a href={heroPrimary.href || "#identity"} className="lora-merged-btn lora-merged-btn--solid">{heroPrimary.label || "Who we are"}</a><a href="#members" className="lora-merged-btn lora-merged-btn--ghost">Founding members</a></div>
        </div>
        <div className="lora-merged-scroll"><span /> Scroll to explore</div>
      </section>

      <section className="lora-merged-manifesto" id="identity">
        <p className="lora-merged-eyebrow lora-merged-reveal">{identitySubtitle}</p>
        <h2 className="lora-merged-reveal">{identityTitle}</h2>
        <p className="lora-merged-reveal">{whoParagraphs[0] ?? "LORA preserves Luweibdeh historical buildings, natural landscape, streets, and greenery while serving its community members."}</p>
      </section>

      <section className="lora-merged-split">
        <div className="lora-merged-media lora-merged-reveal"><Image src={gallery[1]?.src ?? fallbackImages[1].src} alt={gallery[1]?.alt ?? "Luweibdeh public space"} fill sizes="(min-width: 900px) 52vw, 100vw" /><span>{gallery[1]?.caption ?? "Jabal Al-Luweibdeh"}</span></div>
        <div className="lora-merged-copy"><p className="lora-merged-eyebrow lora-merged-reveal">01 / Identity</p><h2 className="lora-merged-reveal">{identityTitle}</h2>{whoParagraphs.slice(0, 3).map((paragraph) => <p className="lora-merged-reveal" key={paragraph}>{paragraph}</p>)}<div className="lora-merged-meta lora-merged-reveal"><div><strong>2024</strong><span>Established</span></div></div></div>
      </section>

      <section className="lora-merged-split lora-merged-split--reverse" id="work">
        <div className="lora-merged-media lora-merged-reveal"><Image src={gallery[2]?.src ?? fallbackImages[2].src} alt={gallery[2]?.alt ?? "LORA work"} fill sizes="(min-width: 900px) 52vw, 100vw" /><span>{gallery[2]?.caption ?? "Community initiatives"}</span></div>
        <div className="lora-merged-copy"><p className="lora-merged-eyebrow lora-merged-reveal">02 / What we do</p><h2 className="lora-merged-reveal">{workTitle}</h2>{(whatParagraphs.length ? whatParagraphs : [workSubtitle]).slice(0, 4).map((paragraph) => <p className="lora-merged-reveal" key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="lora-merged-ritual lora-merged-founders" id="members">
        <div className="lora-merged-ritual__head"><p className="lora-merged-eyebrow">03 / People</p><h2>Founding members</h2></div>
        <div className="lora-merged-track-wrap"><div className="lora-merged-track lora-merged-founders__track">
          {visibleMembers.map((member) => <FounderFlipCard member={member} key={member.id} />)}
        </div></div>
      </section>

      <section className="lora-merged-cta">
        <p className="lora-merged-eyebrow lora-merged-reveal">Continue</p><h2 className="lora-merged-reveal">{text(hero?.content, "ctaTitle", "Explore the visual archive.")}</h2><p className="lora-merged-reveal">{text(hero?.content, "ctaBody", "Photo Gallery and Neighborhood Archive remain independent public tabs.")}</p>
        <div className="lora-merged-actions lora-merged-reveal"><Link href={`${ctaBase}/photo-gallery`} className="lora-merged-btn lora-merged-btn--solid">Photo gallery</Link><Link href={`${ctaBase}/neighborhood-archive`} className="lora-merged-btn lora-merged-btn--outline">Neighborhood archive</Link></div>
      </section>
    </main>
  );
}
