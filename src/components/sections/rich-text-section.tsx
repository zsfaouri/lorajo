"use client";

import Image from "next/image";
import type React from "react";
import { type HTMLMotionProps, type Variants, motion } from "framer-motion";

import { SectionFrame } from "@/components/sections/section-frame";
import { bodyParagraphs, text } from "@/components/sections/section-content";
import { cn, isRecord } from "@/lib/utils";
import type { CmsSection } from "@/types/cms";

export function RichTextSection({ section }: { section: CmsSection }) {
  if (section.variant === "what_we_do_gallery") return <WhatWeDoGallerySection section={section} />;

  const paragraphs = bodyParagraphs(section.content);

  return (
    <SectionFrame section={section} className="bg-[var(--color-parchment)]">
      <motion.div
        className="mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-7 text-xl leading-9 text-black/78 md:text-2xl md:leading-[1.65]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </SectionFrame>
  );
}

interface GalleryGridCellProps extends HTMLMotionProps<"div"> {
  index: number;
}

const springTransitionConfig = {
  type: "spring",
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
} as const;

const filterVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
  },
};

const areaClasses = [
  "col-start-2 col-end-3 row-start-1 row-end-3",
  "col-start-1 col-end-2 row-start-2 row-end-4",
  "col-start-1 col-end-2 row-start-4 row-end-6",
  "col-start-2 col-end-3 row-start-3 row-end-5",
];

const defaultImages = [
  { src: "/lora/gallery/dar-al-anda-art-gallery.jpg", alt: "Dar Al-Anda", caption: "Cultural activity" },
  { src: "/lora/gallery/square-de-paris.jpg", alt: "Paris Square", caption: "Public space" },
  { src: "/lora/gallery/alsaadi-mosque.jpg", alt: "Al Saadi Mosque", caption: "Heritage landmark" },
  { src: "/lora/gallery/blue-house-4.jpg", alt: "Blue House", caption: "Historical architecture" },
];

function getImages(section: CmsSection) {
  const images = section.content.images;
  if (!Array.isArray(images)) return defaultImages;

  const parsed = images
    .filter(isRecord)
    .map((image) => ({
      src: typeof image.src === "string" ? image.src : "/lora/gallery/dar-al-anda-art-gallery.jpg",
      alt: typeof image.alt === "string" ? image.alt : "LORA What We Do image",
      caption: typeof image.caption === "string" ? image.caption : undefined,
    }));

  return parsed.length >= 4 ? parsed.slice(0, 4) : defaultImages;
}

function ContainerStagger({ transition, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{
        staggerChildren: transition?.staggerChildren ?? 0.2,
        delayChildren: transition?.delayChildren ?? 0.2,
        duration: 0.3,
        ...transition,
      }}
      {...props}
    />
  );
}

function ContainerAnimated({ transition, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={filterVariants}
      transition={{
        ...springTransitionConfig,
        duration: 0.3,
        ...transition,
      }}
      {...props}
    />
  );
}

function GalleryGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-2 grid-rows-[50px_150px_50px_150px_50px] gap-4", className)}
      {...props}
    />
  );
}

function GalleryGridCell({ className, transition, index, ...props }: GalleryGridCellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.3,
        delay: index * 0.2,
        delayChildren: transition?.delayChildren ?? 0.2,
      }}
      className={cn("relative overflow-hidden rounded-xl shadow-xl", areaClasses[index], className)}
      {...props}
    />
  );
}

function WhatWeDoGallerySection({ section }: { section: CmsSection }) {
  const paragraphs = bodyParagraphs(section.content);
  const images = getImages(section);
  const title = text(section.content, "title", "What we do ?");
  const subtitle = text(section.content, "subtitle", "Community work for cultural, environmental, and heritage continuity.");

  return (
    <SectionFrame section={section} className="bg-[var(--color-soft-white)] pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <ContainerStagger className="order-2 lg:order-1">
          <GalleryGrid className="mx-auto w-full max-w-[520px]">
            {images.map((image, index) => (
              <GalleryGridCell key={`${image.src}-${index}`} index={index}>
                <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(min-width: 1024px) 260px, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/46 via-black/4 to-transparent" />
                {image.caption ? (
                  <span className="absolute bottom-3 left-3 right-3 text-xs uppercase tracking-[0.14em] text-white/78">
                    {image.caption}
                  </span>
                ) : null}
              </GalleryGridCell>
            ))}
          </GalleryGrid>
        </ContainerStagger>

        <ContainerStagger className="order-1 lg:order-2">
          <ContainerAnimated>
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
            <h1 className="max-w-3xl text-[clamp(3.4rem,8vw,7rem)] font-[var(--font-heading-weight)] leading-[0.9]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/62">{subtitle}</p>
          </ContainerAnimated>

          <div className="mt-10 grid gap-4">
            {paragraphs.map((paragraph, index) => (
              <ContainerAnimated
                key={paragraph}
                className={cn(
                  "border-l-2 border-[var(--color-heritage-green)] bg-white/58 p-5 text-base leading-7 text-black/72 shadow-sm",
                  index === 0 && "text-lg text-black/82",
                )}
              >
                {paragraph}
              </ContainerAnimated>
            ))}
          </div>
        </ContainerStagger>
      </div>
    </SectionFrame>
  );
}
