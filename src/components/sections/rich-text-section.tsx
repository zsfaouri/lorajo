"use client";

import Image from "next/image";
import { useRef } from "react";
import { type HTMLMotionProps, type Variants, motion, useScroll, useTransform } from "framer-motion";

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

const defaultImages = [
  { src: "/lora/gallery/dar-al-anda-art-gallery.jpg", alt: "Dar Al-Anda", caption: "Cultural activity" },
  { src: "/lora/gallery/square-de-paris.jpg", alt: "Paris Square", caption: "Public space" },
  { src: "/lora/gallery/alsaadi-mosque.jpg", alt: "Al Saadi Mosque", caption: "Heritage landmark" },
  { src: "/lora/gallery/blue-house-4.jpg", alt: "Blue House", caption: "Historical architecture" },
  { src: "/lora/gallery/luzmila-hospital.jpg", alt: "Luzmila Hospital", caption: "Neighborhood landmark" },
  { src: "/lora/gallery/luweibdeh-flower.jpg", alt: "Luweibdeh Flower", caption: "Local memory" },
  { src: "/lora/gallery/dscf0022.jpg", alt: "Luweibdeh street detail", caption: "Street detail" },
];

function getImages(section: CmsSection) {
  const images = section.content.images;
  if (!Array.isArray(images)) return defaultImages;

  return images
    .filter(isRecord)
    .map((image) => ({
      src: typeof image.src === "string" ? image.src : "/lora/gallery/dar-al-anda-art-gallery.jpg",
      alt: typeof image.alt === "string" ? image.alt : "LORA What We Do image",
      caption: typeof image.caption === "string" ? image.caption : undefined,
    }))
    .filter((image, index, allImages) => allImages.findIndex((candidate) => candidate.src === image.src) === index)
    .slice(0, 7);
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

function WhatWeDoGallerySection({ section }: { section: CmsSection }) {
  const paragraphs = bodyParagraphs(section.content);
  const images = getImages(section);
  const title = text(section.content, "title", "What we do ?");
  const subtitle = text(section.content, "subtitle", "Community work for cultural, environmental, and heritage continuity.");

  return (
    <SectionFrame section={section} className="bg-[var(--color-soft-white)] !px-0 !py-0">
      <div className="mx-auto max-w-7xl px-5 pt-32 sm:px-8 lg:px-10">
        <ContainerStagger className="max-w-4xl">
          <ContainerAnimated>
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA</p>
            <h1 className="max-w-3xl text-[clamp(3.4rem,8vw,7rem)] font-[var(--font-heading-weight)] leading-[0.9]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/62">{subtitle}</p>
          </ContainerAnimated>
        </ContainerStagger>
      </div>

      {images.length > 0 ? <ZoomParallax images={images} /> : null}

      <div className="mx-auto max-w-7xl px-5 pb-28 sm:px-8 lg:px-10">
        <ContainerStagger className="grid gap-4 lg:grid-cols-2">
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
        </ContainerStagger>
      </div>
    </SectionFrame>
  );
}

function ZoomParallax({ images }: { images: Array<{ src: string; alt?: string; caption?: string }> }) {
  const container = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);
  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  return (
    <div ref={container} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {images.map(({ src, alt, caption }, index) => {
          const scale = scales[index % scales.length];

          return (
            <motion.div
              key={`${src}-${index}`}
              style={{ scale }}
              className={cn(
                "absolute top-0 flex h-full w-full items-center justify-center",
                index === 1 && "[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]",
                index === 2 && "[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]",
                index === 3 && "[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]",
                index === 4 && "[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]",
                index === 5 && "[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]",
                index === 6 && "[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]",
              )}
            >
              <div className="relative h-[25vh] w-[25vw] overflow-hidden bg-black">
                <Image
                  src={src}
                  alt={alt || `Parallax image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 40vw, 70vw"
                  priority={index === 0}
                />
                {caption ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/82 sm:text-xs">{caption}</p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
