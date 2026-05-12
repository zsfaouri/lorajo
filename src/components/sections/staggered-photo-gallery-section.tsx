"use client";

import Image from "next/image";
import type { HTMLAttributes } from "react";
import { useState } from "react";
import { type HTMLMotionProps, type Variants, motion } from "framer-motion";

import { FramerGalleryCarousel } from "@/components/sections/framer-gallery-carousel";
import { SectionFrame } from "@/components/sections/section-frame";
import { ResponsiveSphereImageGrid } from "@/components/sections/sphere-image-grid";
import { cn } from "@/lib/utils";
import type { CmsImage, CmsSection, GalleryCollectionDto } from "@/types/cms";

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

function chunkImages(images: CmsImage[], size: number) {
  const chunks: CmsImage[][] = [];
  for (let index = 0; index < images.length; index += size) {
    chunks.push(images.slice(index, index + size));
  }
  return chunks;
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

function GalleryGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-2 grid-rows-[50px_150px_50px_150px_50px] gap-4", className)} {...props} />
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

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  if (src.includes("supabase.co/storage/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 50vw" />;
}

export function StaggeredPhotoGallerySection({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  const [activeSlug, setActiveSlug] = useState(collections[0]?.slug ?? "");
  const activeCollection = collections.find((collection) => collection.slug === activeSlug) ?? collections[0];
  const images =
    activeCollection?.images.map((image) => ({
      ...image,
      caption: image.caption ?? activeCollection.title,
    })) ?? [];
  const isFamousFigures = activeCollection?.slug === "famous-figures";
  const isCarouselCollection =
    activeCollection?.slug === "historical-photos" || activeCollection?.slug === "landmarks";
  const chunks = chunkImages(images, 4);
  const title = typeof section.content.title === "string" ? section.content.title : "PHOTO GALLERY";
  const subtitle =
    typeof section.content.subtitle === "string"
      ? section.content.subtitle
      : "Historical photos, landmarks, and public memory from Jabal Al-Luweibdeh.";

  return (
    <SectionFrame section={section} className="bg-[var(--color-soft-white)] pt-32">
      <div className="mx-auto max-w-7xl">
        <ContainerStagger className="mb-14 max-w-4xl">
          <ContainerAnimated>
            <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA Archive</p>
            <h1 className="text-[clamp(3.4rem,9vw,8rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9]">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/62">{subtitle}</p>
          </ContainerAnimated>
        </ContainerStagger>

        <div className="mb-12 flex flex-wrap gap-3 border-b border-black/10 pb-6">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setActiveSlug(collection.slug)}
              className={cn(
                "rounded-full border px-5 py-3 text-sm uppercase tracking-[0.14em] transition",
                activeCollection?.slug === collection.slug
                  ? "border-black bg-black text-white"
                  : "border-black/15 bg-white/50 text-black/58 hover:border-black/35 hover:text-black",
              )}
            >
              {collection.title}
              <span className="ml-2 text-xs opacity-60">{collection.images.length}</span>
            </button>
          ))}
        </div>

        {isFamousFigures ? (
          <ContainerAnimated className="rounded-[24px] border border-black/10 bg-[var(--color-parchment)] px-4 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.08)] md:px-10">
            <div className="mb-8 flex flex-col gap-3 text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">Interactive archive</p>
              <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-[var(--font-heading-weight)] uppercase leading-none">
                Famous Figures
              </h2>
            </div>
            <ResponsiveSphereImageGrid
              images={images.map((image, index) => ({
                id: `${activeCollection?.id ?? "famous-figures"}-${index}`,
                src: image.src,
                alt: image.alt,
                title: image.alt,
                description: image.caption ?? image.alt,
              }))}
              autoRotate
              autoRotateSpeed={0.18}
              dragSensitivity={0.45}
              baseImageScale={0.13}
              hoverScale={1.25}
              className="mx-auto"
            />
          </ContainerAnimated>
        ) : isCarouselCollection ? (
          <ContainerAnimated className="rounded-[24px] border border-black/10 bg-[var(--color-parchment)] py-6 shadow-[0_30px_90px_rgba(0,0,0,0.08)] md:py-8">
            <div className="mx-auto mb-2 max-w-4xl px-6 text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">
                {activeCollection?.title}
              </p>
            </div>
            <FramerGalleryCarousel images={images} />
          </ContainerAnimated>
        ) : (
          <div className="grid gap-16 lg:grid-cols-2">
            {chunks.map((chunk, chunkIndex) => (
              <ContainerStagger key={`gallery-chunk-${chunkIndex}`} className="mx-auto w-full max-w-[560px]">
                <GalleryGrid>
                  {chunk.map((image, index) => (
                    <GalleryGridCell key={`${image.src}-${chunkIndex}-${index}`} index={index}>
                      <GalleryImage src={image.src} alt={image.alt} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
                      <span className="absolute bottom-3 left-3 right-3 text-xs uppercase tracking-[0.14em] text-white/84">
                        {image.caption ?? image.alt}
                      </span>
                    </GalleryGridCell>
                  ))}
                </GalleryGrid>
              </ContainerStagger>
            ))}
          </div>
        )}
      </div>
    </SectionFrame>
  );
}
