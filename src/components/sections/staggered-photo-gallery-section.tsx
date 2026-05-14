"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, type HTMLMotionProps, type PanInfo, type Variants, motion } from "framer-motion";

import { ProfileCardGallery } from "@/components/sections/profile-card-gallery";
import { SectionFrame } from "@/components/sections/section-frame";
import { cn } from "@/lib/utils";
import type { CmsImage, CmsSection, GalleryCollectionDto } from "@/types/cms";

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

const bentoSpans = [
  "sm:col-span-2 sm:row-span-4",
  "sm:col-span-1 sm:row-span-3",
  "sm:col-span-1 sm:row-span-5",
  "sm:col-span-2 sm:row-span-3",
  "sm:col-span-1 sm:row-span-4",
  "sm:col-span-2 sm:row-span-5",
  "sm:col-span-1 sm:row-span-3",
  "sm:col-span-1 sm:row-span-4",
];

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

function GalleryImage({ src, alt, className, priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  if (src.includes("supabase.co/storage/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} loading="lazy" decoding="async" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="(min-width: 1024px) 720px, (min-width: 640px) 50vw, 100vw"
      priority={priority}
    />
  );
}

function captionFor(image: CmsImage) {
  return image.caption ?? image.alt;
}

export function InteractiveBentoGallery({ images, title }: { images: CmsImage[]; title: string }) {
  const [items, setItems] = useState(images);
  const [selectedItem, setSelectedItem] = useState<CmsImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setItems(images);
    setSelectedItem(null);
    setDockPosition({ x: 0, y: 0 });
  }, [images]);

  function reorderItem(index: number, info: PanInfo) {
    setIsDragging(false);

    const moveDistance = info.offset.x + info.offset.y;
    if (Math.abs(moveDistance) <= 50) return;

    setItems((currentItems) => {
      const nextItems = [...currentItems];
      const draggedItem = nextItems[index];
      const targetIndex = moveDistance > 0 ? Math.min(index + 1, currentItems.length - 1) : Math.max(index - 1, 0);

      nextItems.splice(index, 1);
      nextItems.splice(targetIndex, 0, draggedItem);

      return nextItems;
    });
  }

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-black/15 bg-white/50 p-8 text-sm text-black/50">
        No gallery images available.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ContainerAnimated className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">{title}</p>
      </ContainerAnimated>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="fixed inset-0 z-40 min-h-screen overflow-hidden rounded-none bg-white/45 backdrop-blur-lg sm:inset-x-6 sm:inset-y-8 sm:rounded-xl md:inset-x-12"
            >
              <div className="flex h-full flex-col">
                <div className="flex flex-1 items-center justify-center bg-gray-50/50 p-2 sm:p-3 md:p-4">
                  <AnimatePresence mode="wait">
                    <motion.button
                      type="button"
                      key={selectedItem.src}
                      className="relative h-auto max-h-[70vh] w-full max-w-[95%] overflow-hidden rounded-lg bg-gray-900/20 shadow-md sm:max-w-[85%] md:max-w-3xl"
                      initial={{ y: 20, scale: 0.97 }}
                      animate={{
                        y: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 0.5,
                        },
                      }}
                      exit={{
                        y: 20,
                        scale: 0.97,
                        transition: { duration: 0.15 },
                      }}
                      onClick={() => setSelectedItem(null)}
                      aria-label="Close gallery image"
                    >
                      <span className="block aspect-video w-full">
                        <GalleryImage src={selectedItem.src} alt={selectedItem.alt} className="object-contain" priority />
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-left sm:p-3 md:p-4">
                        <h3 className="text-base font-semibold text-white sm:text-lg md:text-xl">{captionFor(selectedItem)}</h3>
                        <p className="mt-1 text-xs text-white/80 sm:text-sm">{selectedItem.alt}</p>
                      </div>
                    </motion.button>
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-gray-200/80 p-2 text-gray-700 backdrop-blur-sm hover:bg-gray-300/80 sm:right-2.5 sm:top-2.5 md:right-3 md:top-3"
                onClick={() => setSelectedItem(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close gallery"
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.div>

            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0.1}
              initial={false}
              animate={{ x: dockPosition.x, y: dockPosition.y }}
              onDragEnd={(_, info) => {
                setDockPosition((currentPosition) => ({
                  x: currentPosition.x + info.offset.x,
                  y: currentPosition.y + info.offset.y,
                }));
              }}
              className="fixed bottom-4 left-1/2 z-50 touch-none"
            >
              <motion.div className="relative -translate-x-1/2 cursor-grab rounded-xl border border-blue-400/30 bg-sky-400/20 shadow-lg backdrop-blur-xl active:cursor-grabbing">
                <div className="flex items-center -space-x-2 px-3 py-2">
                  {items.map((item, index) => (
                    <motion.button
                      key={`${item.src}-${index}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedItem(item);
                      }}
                      style={{
                        zIndex: selectedItem.src === item.src ? 30 : items.length - index,
                      }}
                      className={cn(
                        "relative h-8 w-8 shrink-0 overflow-hidden rounded-lg sm:h-9 sm:w-9 md:h-10 md:w-10",
                        selectedItem.src === item.src ? "ring-2 ring-white/70 shadow-lg" : "hover:ring-2 hover:ring-white/30",
                      )}
                      initial={{ rotate: index % 2 === 0 ? -15 : 15 }}
                      animate={{
                        scale: selectedItem.src === item.src ? 1.2 : 1,
                        rotate: selectedItem.src === item.src ? 0 : index % 2 === 0 ? -15 : 15,
                        y: selectedItem.src === item.src ? -8 : 0,
                      }}
                      whileHover={{
                        scale: 1.3,
                        rotate: 0,
                        y: -10,
                        transition: { type: "spring", stiffness: 400, damping: 25 },
                      }}
                      aria-label={`Show ${captionFor(item)}`}
                    >
                      <GalleryImage src={item.src} alt={item.alt} className="object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                      {selectedItem.src === item.src && (
                        <motion.span
                          layoutId="activeGlow"
                          className="absolute -inset-2 bg-white/20 blur-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        ) : (
          <motion.div
            className="grid auto-rows-[60px] grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {items.map((item, index) => (
              <motion.div
                key={`${item.src}-${index}`}
                layoutId={`media-${item.src}`}
                className={cn("relative min-h-[220px] cursor-move overflow-hidden rounded-xl sm:min-h-0", bentoSpans[index % bentoSpans.length])}
                onClick={() => !isDragging && setSelectedItem(item)}
                variants={{
                  hidden: { y: 50, scale: 0.9, opacity: 0 },
                  visible: {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                      delay: index * 0.05,
                    },
                  },
                }}
                whileHover={{ scale: 1.02 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => reorderItem(index, info)}
              >
                <GalleryImage src={item.src} alt={item.alt} className="object-cover" priority={index === 0} />
                <motion.div
                  className="absolute inset-0 flex flex-col justify-end p-2 opacity-100 sm:p-3 md:p-4 lg:opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <h3 className="relative line-clamp-1 text-xs font-medium text-white sm:text-sm md:text-base">{captionFor(item)}</h3>
                  <p className="relative mt-0.5 line-clamp-2 text-[10px] text-white/70 sm:text-xs md:text-sm">{item.alt}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StaggeredPhotoGallerySection({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  const galleryCollections = collections.filter((collection) =>
    ["famous-figures", "historical-photos", "landmarks"].includes(collection.slug),
  );
  const [activeSlug, setActiveSlug] = useState(galleryCollections[0]?.slug ?? "");
  const activeCollection = galleryCollections.find((collection) => collection.slug === activeSlug) ?? galleryCollections[0];
  const images =
    activeCollection?.images.map((image) => ({
      ...image,
      caption: image.caption ?? activeCollection.title,
    })) ?? [];
  const isBentoCollection = activeCollection?.slug === "historical-photos" || activeCollection?.slug === "landmarks";
  const isFamousFigures = activeCollection?.slug === "famous-figures";
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
          {galleryCollections.map((collection) => (
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
          <ContainerAnimated>
            <ProfileCardGallery images={images} />
          </ContainerAnimated>
        ) : isBentoCollection ? (
          <InteractiveBentoGallery images={images} title={activeCollection?.title ?? ""} />
        ) : (
          <div className="rounded-md border border-dashed border-black/15 bg-white/50 p-8 text-sm text-black/50">
            No gallery images available.
          </div>
        )}
      </div>
    </SectionFrame>
  );
}
