"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { SectionFrame } from "@/components/sections/section-frame";
import { EventCard } from "@/components/ui/event-card";
import type { CmsSection, EventDto } from "@/types/cms";

const fallbackImage = "/lora/gallery/square-de-paris.jpg";

function asDate(value?: string | null) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatTime(event: EventDto) {
  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  if (!startsAt || Number.isNaN(startsAt.getTime())) return "Time to be announced";

  const start = startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (!endsAt || Number.isNaN(endsAt.getTime())) return start;

  return `${start} - ${endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function sectionText(section: CmsSection, key: string, fallback: string) {
  const value = section.content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function EventListSection({ section, events }: { section: CmsSection; events: EventDto[] }) {
  const [activeEvent, setActiveEvent] = useState<EventDto | null>(null);
  const title = sectionText(section, "title", "Events");
  const subtitle = sectionText(section, "subtitle", "Upcoming gatherings, meetings, and neighborhood programs.");

  return (
    <SectionFrame section={section} className="bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
            <h2 className="mt-4 text-[clamp(2.4rem,6vw,5rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9] text-slate-950">
              {title}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        {events.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                heading={event.summary ?? "LORA event"}
                description={event.body ?? "Details will be shared by LORA."}
                date={asDate(event.startsAt)}
                imageUrl={event.image?.src ?? fallbackImage}
                imageAlt={event.image?.alt ?? event.title}
                eventName={event.title}
                location={event.location ?? "Location to be announced"}
                time={formatTime(event)}
                actionLabel={event.actionLabel ?? "View details"}
                onActionClick={() => setActiveEvent(event)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-sm text-slate-500">No published events yet.</div>
        )}
      </div>

      <AnimatePresence>
        {activeEvent ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-950 shadow-2xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setActiveEvent(null)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                aria-label="Close event details"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">
                {formatTime(activeEvent)}
              </p>
              <h3 className="mt-4 pr-10 text-3xl font-semibold">{activeEvent.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{activeEvent.location ?? "Location to be announced"}</p>
              <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">
                {activeEvent.body ?? activeEvent.summary ?? "Details will be shared by LORA."}
              </p>
              {activeEvent.videoUrl ? (
                <a className="mt-5 inline-flex text-sm font-medium text-[var(--color-heritage-green)] underline underline-offset-4" href={activeEvent.videoUrl} target="_blank" rel="noreferrer">
                  Open video
                </a>
              ) : null}
              {activeEvent.invitationUrl ? (
                <a className="ml-4 mt-5 inline-flex text-sm font-medium text-[var(--color-heritage-green)] underline underline-offset-4" href={activeEvent.invitationUrl} target="_blank" rel="noreferrer">
                  Open invitation
                </a>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SectionFrame>
  );
}
