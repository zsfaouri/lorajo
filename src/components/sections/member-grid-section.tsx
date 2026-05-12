"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { CmsSection, MemberDto } from "@/types/cms";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

const placeholderBase = "https://placehold.co/500x500/e2e8f0/64748b";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getText(content: CmsSection["content"], key: string, fallback: string) {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getTestimonials(members: MemberDto[], quote: string): Testimonial[] {
  return members.map((member) => ({
    quote,
    name: member.name,
    designation: member.title ?? "Founding member",
    src: member.image?.src ?? `${placeholderBase}?text=${encodeURIComponent(getInitials(member.name))}`,
  }));
}

const AnimatedTestimonials = ({
  testimonials,
  autoplay = true,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!autoplay || testimonials.length < 2) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [autoplay, handleNext, testimonials.length]);

  useEffect(() => {
    setActive((current) => Math.min(current, testimonials.length - 1));
  }, [testimonials.length]);

  if (!testimonials.length) return null;

  const isActive = (index: number) => index === active;
  const randomRotate = () => `${Math.floor(Math.random() * 16) - 8}deg`;

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-20">
        <div className="flex items-center justify-center">
          <div className="relative h-80 w-full max-w-xs">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={`${testimonial.src}-${testimonial.name}`}
                  initial={{ opacity: 0, scale: 0.9, y: 50, rotate: randomRotate() }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.5,
                    scale: isActive(index) ? 1 : 0.9,
                    y: isActive(index) ? 0 : 20,
                    zIndex: isActive(index) ? testimonials.length : testimonials.length - Math.abs(index - active),
                    rotate: isActive(index) ? "0deg" : randomRotate(),
                  }}
                  exit={{ opacity: 0, scale: 0.9, y: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                  style={{ perspective: "1000px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover shadow-2xl"
                    onError={(event) => {
                      event.currentTarget.src = `${placeholderBase}?text=${encodeURIComponent(testimonial.name.charAt(0))}`;
                      event.currentTarget.onerror = null;
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col justify-between"
            >
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{testimonials[active].name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{testimonials[active].designation}</p>
                <motion.p className="mt-8 text-lg text-slate-700 dark:text-slate-300">
                  &quot;{testimonials[active].quote}&quot;
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
          {testimonials.length > 1 ? (
            <div className="flex gap-4 pt-12">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
              >
                <ArrowLeft className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:-translate-x-1 dark:text-slate-300" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
              >
                <ArrowRight className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:translate-x-1 dark:text-slate-300" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

function AnimatedTestimonialsDemo({ testimonials }: { testimonials: Testimonial[] }) {
  return <AnimatedTestimonials testimonials={testimonials} />;
}

function Component({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div className="founding-members-experience relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      <style>
        {`
          @keyframes animate-grid {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
          .animated-grid {
            width: 200%;
            height: 200%;
            background-image:
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
            background-size: 3rem 3rem;
            animation: animate-grid 40s linear infinite alternate;
          }
          .dark .animated-grid {
            background-image:
              linear-gradient(to right, #1e293b 1px, transparent 1px),
              linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          }
        `}
      </style>
      <div className="animated-grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
      <div className="z-10">
        <AnimatedTestimonialsDemo testimonials={testimonials} />
      </div>
    </div>
  );
}

export function MemberGridSection({ section, members }: { section: CmsSection; members: MemberDto[] }) {
  const quote = getText(
    section.content,
    "quote",
    "LORA's founding members bring together residents committed to preserving Luweibdeh's architecture, streets, greenery, and community life.",
  );
  const testimonials = useMemo(() => getTestimonials(members, quote), [members, quote]);

  return <Component testimonials={testimonials} />;
}
