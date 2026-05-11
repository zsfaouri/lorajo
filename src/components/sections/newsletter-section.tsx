"use client";

import { useState } from "react";

import { SectionFrame } from "@/components/sections/section-frame";
import { text } from "@/components/sections/section-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsSection } from "@/types/cms";

export function NewsletterSection({ section }: { section: CmsSection }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), name: form.get("name") }),
    });
    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <SectionFrame section={section} className="bg-[var(--color-black)] text-white">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[var(--color-heritage-green)]">Newsletter</p>
          <h2 className="text-[clamp(2rem,5vw,4.6rem)] font-[var(--font-heading-weight)] leading-none">
            {text(section.content, "title")}
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60">{text(section.content, "body")}</p>
        </div>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Input name="name" placeholder="Name" className="border-white/20 bg-white/8 text-white placeholder:text-white/35" />
          <Input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="border-white/20 bg-white/8 text-white placeholder:text-white/35"
          />
          <Button type="submit" variant="green" disabled={status === "sending"}>
            {status === "sent" ? "Subscribed" : text(section.content, "buttonLabel", "Subscribe")}
          </Button>
          {status === "error" ? <p className="text-sm text-[var(--color-terracotta)]">Submission failed.</p> : null}
        </form>
      </div>
    </SectionFrame>
  );
}
