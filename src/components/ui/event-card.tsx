"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EventCardProps {
  heading: string;
  description: string;
  date: Date;
  imageUrl: string;
  imageAlt: string;
  eventName: string;
  location: string;
  time: string;
  actionLabel: string;
  onActionClick: () => void;
  className?: string;
}

const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(
  (
    {
      heading,
      description,
      date,
      imageUrl,
      imageAlt,
      eventName,
      location,
      time,
      actionLabel,
      onActionClick,
      className,
    },
    ref,
  ) => {
    const year = date.getFullYear();
    const labelledBy = React.useId();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        ref={ref}
        className={cn(
          "w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 font-sans text-slate-950 shadow-sm",
          className,
        )}
        aria-labelledby={labelledBy}
      >
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{heading}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest text-slate-500">YEAR</p>
              <p className="text-4xl font-bold text-slate-950">{year}</p>
            </div>
          </div>

          <div className="my-6 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={640}
              height={360}
              unoptimized
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div>
            <h3 id={labelledBy} className="text-lg font-semibold text-slate-950">
              {eventName}
            </h3>
            <div className="mt-3 flex flex-col space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{time}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onActionClick}
              className="rounded-md text-sm font-medium text-[var(--color-heritage-green)] transition-colors hover:text-[var(--color-heritage-green)]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-heritage-green)] focus-visible:ring-offset-2"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </motion.div>
    );
  },
);

EventCard.displayName = "EventCard";

export { EventCard };
