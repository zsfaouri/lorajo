"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, Instagram, Linkedin, Twitter } from "lucide-react";

import { SectionFrame } from "@/components/sections/section-frame";
import { cn } from "@/lib/utils";
import type { CmsSection, MemberDto } from "@/types/cms";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string | null;
  initials: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    behance?: string;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTeamMembers(members: MemberDto[]): TeamMember[] {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.title ?? "Founding member",
    image: member.image?.src ?? null,
    initials: getInitials(member.name),
  }));
}

function MemberImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-full w-full object-cover transition-[filter,transform] duration-500" />;
  }

  return <Image src={src} alt={alt} fill sizes="180px" className="object-cover transition-[filter,transform] duration-500" />;
}

export function MemberGridSection({ section, members }: { section: CmsSection; members: MemberDto[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const teamMembers = getTeamMembers(members);
  const title = typeof section.content.title === "string" ? section.content.title : "Founding members";
  const subtitle =
    typeof section.content.subtitle === "string"
      ? section.content.subtitle
      : "Dedication. Expertise. Passion.";

  const col1 = teamMembers.filter((_, index) => index % 3 === 0);
  const col2 = teamMembers.filter((_, index) => index % 3 === 1);
  const col3 = teamMembers.filter((_, index) => index % 3 === 2);

  return (
    <SectionFrame section={section}>
      <div className="mx-auto flex w-full max-w-6xl select-none flex-col gap-10 px-4 py-10 font-sans md:flex-row md:items-start md:gap-12 md:px-6 lg:gap-16">
        <div className="min-w-0 flex-1 md:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
          <h1 className="text-[clamp(2.6rem,12vw,5rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9] text-black">
            {title}
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.18em] text-black/45">{subtitle}</p>
        </div>

        <div className="flex flex-shrink-0 gap-2 overflow-x-auto pb-1 md:gap-3 md:overflow-visible md:pb-0">
          <div className="flex flex-col gap-2 md:gap-3">
            {col1.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="h-[120px] w-[110px] sm:h-[140px] sm:w-[130px] md:h-[165px] md:w-[155px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          <div className="mt-[48px] flex flex-col gap-2 sm:mt-[56px] md:mt-[68px] md:gap-3">
            {col2.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="h-[132px] w-[122px] sm:h-[155px] sm:w-[145px] md:h-[182px] md:w-[172px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          <div className="mt-[22px] flex flex-col gap-2 sm:mt-[26px] md:mt-[32px] md:gap-3">
            {col3.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="h-[125px] w-[115px] sm:h-[146px] sm:w-[136px] md:h-[172px] md:w-[162px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 pt-0 sm:grid sm:grid-cols-2 md:flex md:flex-col md:gap-5 md:pt-2">
          <div className="mb-4 hidden md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
            <h1 className="text-[clamp(3rem,7vw,5.7rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9] text-black">
              {title}
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">{subtitle}</p>
          </div>

          {teamMembers.map((member) => (
            <MemberRow key={member.id} member={member} hoveredId={hoveredId} onHover={setHoveredId} />
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

function PhotoCard({
  member,
  className,
  hoveredId,
  onHover,
}: {
  member: TeamMember;
  className: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[var(--color-stone-light)] transition-opacity duration-300",
        className,
        isDimmed ? "opacity-60" : "opacity-100",
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      {member.image ? (
        <div
          className="absolute inset-0"
          style={{
            filter: isActive ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.77)",
            transform: isActive ? "scale(1.04)" : "scale(1)",
          }}
        >
          <MemberImage src={member.image} alt={member.name} />
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-[var(--color-stone)] text-3xl font-semibold text-black/38 transition-[filter] duration-500"
          style={{ filter: isActive ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.82)" }}
        >
          {member.initials}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  hoveredId,
  onHover,
}: {
  member: TeamMember;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;
  const hasSocial = member.social?.twitter ?? member.social?.linkedin ?? member.social?.instagram ?? member.social?.behance;

  return (
    <div
      className={cn("cursor-pointer transition-opacity duration-300", isDimmed ? "opacity-50" : "opacity-100")}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-3 w-4 flex-shrink-0 rounded-[5px] transition-all duration-300",
            isActive ? "w-5 bg-black" : "bg-black/25",
          )}
        />
        <span
          className={cn(
            "text-base font-semibold leading-none tracking-normal transition-colors duration-300 md:text-[18px]",
            isActive ? "text-black" : "text-black/80",
          )}
        >
          {member.name}
        </span>

        {hasSocial ? (
          <div
            className={cn(
              "ml-0.5 flex items-center gap-1.5 transition-all duration-200",
              isActive ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0",
            )}
          >
            {member.social?.twitter ? <SocialLink href={member.social.twitter} label="X / Twitter" icon="twitter" /> : null}
            {member.social?.linkedin ? <SocialLink href={member.social.linkedin} label="LinkedIn" icon="linkedin" /> : null}
            {member.social?.instagram ? <SocialLink href={member.social.instagram} label="Instagram" icon="instagram" /> : null}
            {member.social?.behance ? <SocialLink href={member.social.behance} label="Behance" icon="behance" /> : null}
          </div>
        ) : null}
      </div>

      <p className="mt-1.5 pl-[27px] text-[8px] font-medium uppercase tracking-[0.2em] text-black/45 md:text-[10px]">
        {member.role}
      </p>
    </div>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: "twitter" | "linkedin" | "instagram" | "behance" }) {
  const Icon = icon === "twitter" ? Twitter : icon === "linkedin" ? Linkedin : icon === "instagram" ? Instagram : BadgeCheck;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="rounded p-1 text-black/45 transition-all duration-150 hover:scale-110 hover:bg-black/10 hover:text-black"
      title={label}
    >
      <Icon size={11} />
      <span className="sr-only">{label}</span>
    </a>
  );
}
