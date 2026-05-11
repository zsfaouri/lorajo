"use client";

import { useState } from "react";

import { SectionFrame } from "@/components/sections/section-frame";
import { text } from "@/components/sections/section-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CmsSection } from "@/types/cms";

export function ContactSection({ section }: { section: CmsSection }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setStatus(response.ok ? "sent" : "error");
  }

  return (
    <SectionFrame section={section}>
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1fr]">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Contact</p>
          <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-[var(--font-heading-weight)] leading-none">
            {text(section.content, "title", "Contact LORA")}
          </h2>
          <p className="mt-6 text-lg leading-8 text-black/62">{text(section.content, "body")}</p>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 rounded-[var(--radius-card)] border border-black/10 bg-white p-5">
          <Input required name="name" placeholder="Name" />
          <Input required type="email" name="email" placeholder="Email" />
          <Input name="phone" placeholder="Phone" />
          <Input name="subject" placeholder="Subject" />
          <Textarea required name="message" placeholder="Message" />
          <Button type="submit" variant="green" disabled={status === "sending"}>
            {status === "sent" ? "Sent" : "Send"}
          </Button>
          {status === "error" ? <p className="text-sm text-[var(--color-terracotta)]">Submission failed.</p> : null}
        </form>
      </div>
    </SectionFrame>
  );
}
