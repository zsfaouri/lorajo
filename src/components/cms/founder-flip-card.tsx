"use client";

import Image from "next/image";
import { useState } from "react";

import type { MemberDto } from "@/types/cms";

type Props = {
  member: MemberDto;
};

export function FounderFlipCard({ member }: Props) {
  const [flipped, setFlipped] = useState(false);
  const title = member.title ?? "Founding member";
  const backText = member.bio?.trim() || `${member.name} · ${title}`;

  return (
    <button
      type="button"
      className={`lora-merged-step lora-merged-founder-card${flipped ? " is-flipped" : ""}`}
      aria-pressed={flipped}
      aria-label={`${member.name}. Click to ${flipped ? "show photo" : "read details"}.`}
      onClick={() => setFlipped((current) => !current)}
    >
      <span className="lora-merged-founder-card__inner">
        <span className="lora-merged-founder-card__face lora-merged-founder-card__front">
          {member.image?.src ? (
            <Image
              src={member.image.src}
              alt={member.image.alt ?? member.name}
              fill
              sizes="(min-width: 900px) 340px, 72vw"
            />
          ) : (
            <span className="lora-merged-founder-card__initials">{member.name.slice(0, 2).toUpperCase()}</span>
          )}
          <span className="lora-merged-founder-card__copy">
            <span>{title}</span>
            <strong>{member.name}</strong>
          </span>
        </span>
        <span className="lora-merged-founder-card__face lora-merged-founder-card__back">
          <span>{title}</span>
          <strong>{member.name}</strong>
          <em>{backText}</em>
        </span>
      </span>
    </button>
  );
}
