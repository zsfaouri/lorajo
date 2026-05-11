"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { CmsImage } from "@/types/cms";

export function FramerGalleryCarousel({ images }: { images: CmsImage[] }) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth || 1;
    const targetX = -index * containerWidth;

    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });

    return () => controls.stop();
  }, [index, x]);

  useEffect(() => {
    setIndex(0);
    x.set(0);
  }, [images, x]);

  if (!images.length) {
    return (
      <div className="mx-auto flex h-[420px] max-w-4xl items-center justify-center rounded-lg border border-dashed border-black/20 bg-white/35 text-black/45">
        No images available
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-2 sm:p-4 lg:p-10">
      <div className="flex flex-col gap-3">
        <div ref={containerRef} className="relative overflow-hidden rounded-lg bg-black shadow-[0_28px_80px_rgba(0,0,0,0.18)]">
          <motion.div className="flex" style={{ x }}>
            {images.map((item, itemIndex) => (
              <div key={`${item.src}-${itemIndex}`} className="relative h-[360px] w-full shrink-0 sm:h-[500px]">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="select-none rounded-lg object-cover"
                  sizes="(min-width: 1024px) 896px, 100vw"
                  draggable={false}
                  priority={itemIndex === 0}
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <div className="absolute bottom-7 left-7 right-24 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                    {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-2xl font-medium leading-tight md:text-4xl">{item.caption ?? item.alt}</h3>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            className={`absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform ${
              index === 0 ? "cursor-not-allowed bg-white/55 opacity-40" : "bg-white/80 opacity-80 hover:scale-110 hover:opacity-100"
            }`}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>

          <motion.button
            type="button"
            disabled={index === images.length - 1}
            onClick={() => setIndex((current) => Math.min(images.length - 1, current + 1))}
            className={`absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform ${
              index === images.length - 1
                ? "cursor-not-allowed bg-white/55 opacity-40"
                : "bg-white/80 opacity-80 hover:scale-110 hover:opacity-100"
            }`}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </motion.button>

          <div className="absolute bottom-4 left-1/2 flex max-w-[80%] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl border border-white/30 bg-white/20 p-2 backdrop-blur">
            {images.map((item, itemIndex) => (
              <button
                key={`${item.src}-dot`}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`h-2 shrink-0 rounded-full transition-all ${itemIndex === index ? "w-8 bg-white" : "w-2 bg-white/50"}`}
                aria-label={`Show ${item.caption ?? item.alt}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
