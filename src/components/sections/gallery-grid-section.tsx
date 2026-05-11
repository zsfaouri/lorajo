"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/sections/reveal";
import { SectionFrame } from "@/components/sections/section-frame";
import { Button } from "@/components/ui/button";
import { isRecord } from "@/lib/utils";
import type { CmsImage, CmsSection } from "@/types/cms";

function getItems(section: CmsSection): CmsImage[] {
  const items = section.content.items;
  if (!Array.isArray(items)) return [];

  return items
    .filter(isRecord)
    .map((item) => ({
      src: typeof item.src === "string" ? item.src : "/lora/gallery/luweibdeh-flower.jpg",
      alt: typeof item.alt === "string" ? item.alt : "LORA gallery image",
      caption: typeof item.caption === "string" ? item.caption : undefined,
    }));
}

export function GalleryGridSection({ section }: { section: CmsSection }) {
  const [active, setActive] = useState<CmsImage | null>(null);
  const items = getItems(section);
  const title = typeof section.content.title === "string" ? section.content.title : "Gallery";

  return (
    <SectionFrame section={section}>
      <Reveal className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="max-w-2xl text-[clamp(2rem,5vw,4.8rem)] font-[var(--font-heading-weight)] leading-none">
            {title}
          </h2>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-black/45 md:block">Archive</span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {items.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => setActive(item)}
              className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-media)] bg-black text-left md:even:mt-12"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                sizes="(min-width: 768px) 25vw, 100vw"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm text-white">
                {item.caption ?? `Image ${index + 1}`}
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <AnimatePresence>
        {active ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/86 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 bg-white/10 text-white hover:bg-white/20"
              aria-label="Close gallery image"
            >
              <X size={18} />
            </Button>
            <motion.div
              className="relative h-[82vh] w-full max-w-5xl"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
            >
              <Image src={active.src} alt={active.alt} fill className="object-contain" sizes="100vw" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SectionFrame>
  );
}
