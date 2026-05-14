"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { CmsSection, GalleryCollectionDto } from "@/types/cms";

type GalleryFilter = "all" | "historical-photos" | "landmarks" | "famous-figures";

type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  info: string;
  collectionTitle: string;
  filter: GalleryFilter;
};

const filters: Array<{ label: string; value: GalleryFilter }> = [
  { label: "All", value: "all" },
  { label: "Historical Pics", value: "historical-photos" },
  { label: "Landmarks", value: "landmarks" },
  { label: "Famous Figures", value: "famous-figures" },
];

function titleFromContent(section: CmsSection) {
  return typeof section.content.title === "string" ? section.content.title : "Photo Gallery";
}

function subtitleFromContent(section: CmsSection) {
  return typeof section.content.subtitle === "string"
    ? section.content.subtitle
    : "Historical photos, landmarks, and public memory from Jabal Al-Luweibdeh.";
}

function toGalleryItems(collections: GalleryCollectionDto[]): GalleryItem[] {
  return collections
    .filter((collection) => ["famous-figures", "historical-photos", "landmarks"].includes(collection.slug))
    .flatMap((collection) =>
      collection.images.map((image, index) => ({
        id: `${collection.id}-${image.src}-${index}`,
        src: image.src,
        alt: image.alt,
        title: image.caption ?? image.alt ?? collection.title,
        info: image.caption ?? collection.description ?? collection.title,
        collectionTitle: collection.title,
        filter: collection.slug as GalleryFilter,
      })),
    );
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  if (src.includes("supabase.co/storage/") || src.includes("drive.google.com/") || src.includes("googleusercontent.com/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="h-full w-full object-cover" src={src} alt={alt} loading="lazy" decoding="async" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
    />
  );
}

export function FeaturedPhotoGallery({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("all");
  const items = useMemo(() => toGalleryItems(collections), [collections]);
  const visibleItems = activeFilter === "all" ? items : items.filter((item) => item.filter === activeFilter);
  const title = titleFromContent(section);
  const subtitle = subtitleFromContent(section);

  return (
    <section className="featured_projects bg-[var(--color-soft-white)] px-5 py-24 sm:px-8 lg:px-10">
      <div className="container-block bg mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[var(--color-heritage-green)]">LORA Archive</p>
          <h2 className="text-[clamp(3rem,7vw,6rem)] font-[var(--font-heading-weight)] uppercase leading-[0.92] text-black">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/58">{subtitle}</p>
        </div>

        <div className="responsive-container-block opt-cont mt-10 flex flex-wrap items-center justify-center gap-3">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              data-filter={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "text-blk tab rounded-full border px-5 py-3 text-sm uppercase tracking-[0.14em] transition",
                activeFilter === filter.value
                  ? "tab-active border-black bg-black text-white"
                  : "border-black/15 bg-white text-black/55 hover:border-black/35 hover:text-black",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="responsive-container-block content mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item, index) => (
            <article
              key={item.id}
              className={cn(
                "responsive-container-block img group relative min-h-[360px] overflow-hidden rounded-lg bg-black",
                item.filter,
                index % 5 === 0 && "lg:row-span-2 lg:min-h-[520px]",
              )}
            >
              <GalleryImage src={item.src} alt={item.alt} />
              <div
                className={cn(
                  "responsive-container-block overlay absolute inset-0 bg-black/15 transition duration-500 group-hover:bg-black/58",
                  index === 1 && "overlay-visible bg-black/42",
                )}
              />
              <div className="responsive-container-block desc absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-blk title text-xl font-semibold leading-tight">{item.title}</p>
                <p className="text-blk info mt-2 line-clamp-3 text-sm leading-6 text-white/76">{item.info}</p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/54">{item.collectionTitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
