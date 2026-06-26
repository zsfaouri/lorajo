"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CmsSection, GalleryCollectionDto } from "@/types/cms";

type GalleryFilter = "all" | "historical-photos" | "landmarks" | "famous-figures";

type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  text: string;
  collectionTitle: string;
  filter: GalleryFilter;
};

const fallbackFilterLabels: Record<GalleryFilter, string> = {
  all: "All",
  "historical-photos": "Historical Pics",
  landmarks: "Landmarks",
  "famous-figures": "Famous Figures",
};

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
        text: image.caption ?? collection.description ?? collection.title,
        collectionTitle: collection.title,
        filter: collection.slug as GalleryFilter,
      })),
    );
}

function SmartImage({
  src,
  alt,
  mode,
  priority = false,
}: {
  src: string;
  alt: string;
  mode: "cover" | "contain";
  priority?: boolean;
}) {
  const className = mode === "cover" ? "object-cover" : "object-contain";
  const isRemote = src.includes("supabase.co/storage/") || src.includes("drive.google.com/") || src.includes("googleusercontent.com/");
  if (isRemote) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`h-full w-full ${className}`} src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />;
  }

  return <Image src={src} alt={alt} fill className={className} sizes={mode === "cover" ? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" : "100vw"} priority={priority} />;
}

export function FeaturedPhotoGallery({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const items = useMemo(() => toGalleryItems(collections), [collections]);
  const filters = useMemo<Array<{ label: string; value: GalleryFilter }>>(() => {
    const labelFor = (slug: GalleryFilter) => collections.find((collection) => collection.slug === slug)?.title ?? fallbackFilterLabels[slug];
    return [
      { label: fallbackFilterLabels.all, value: "all" },
      { label: labelFor("historical-photos"), value: "historical-photos" },
      { label: labelFor("landmarks"), value: "landmarks" },
      { label: labelFor("famous-figures"), value: "famous-figures" },
    ];
  }, [collections]);
  const visibleItems = useMemo(() => (activeFilter === "all" ? items : items.filter((item) => item.filter === activeFilter)), [activeFilter, items]);
  const activeItem = activeIndex == null ? null : visibleItems[activeIndex] ?? null;
  const title = titleFromContent(section);
  const subtitle = subtitleFromContent(section);

  useEffect(() => {
    setActiveIndex(null);
  }, [activeFilter]);

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current == null ? current : (current + 1) % visibleItems.length));
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current == null ? current : (current - 1 + visibleItems.length) % visibleItems.length));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeItem, visibleItems.length]);

  function next() {
    setActiveIndex((current) => (current == null ? current : (current + 1) % visibleItems.length));
  }

  function previous() {
    setActiveIndex((current) => (current == null ? current : (current - 1 + visibleItems.length) % visibleItems.length));
  }

  return (
    <section className="lora-gallery">
      <div className="lora-gallery__head">
        <p className="lora-merged-eyebrow">LORA Archive</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="lora-gallery__filters" role="tablist" aria-label="Photo gallery categories">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(activeFilter === filter.value && "is-active")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleItems.length ? (
        <div className="lora-gallery__grid">
          {visibleItems.map((item, index) => (
            <button key={item.id} type="button" className="lora-gallery__tile" onClick={() => setActiveIndex(index)}>
              <span className="lora-gallery__image">
                <SmartImage src={item.src} alt={item.alt} mode="cover" priority={index < 4} />
              </span>
              <span className="lora-gallery__caption">
                <span>{item.collectionTitle}</span>
                <strong>{item.title}</strong>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="lora-gallery__empty">No gallery images available.</div>
      )}

      {activeItem ? (
        <div className="lora-gallery-lightbox" role="dialog" aria-modal="true" aria-label={activeItem.title}>
          <button type="button" className="lora-gallery-lightbox__close" onClick={() => setActiveIndex(null)} aria-label="Close image">
            <X size={22} />
          </button>
          <button type="button" className="lora-gallery-lightbox__nav lora-gallery-lightbox__nav--prev" onClick={previous} aria-label="Previous image">
            <ChevronLeft size={28} />
          </button>
          <figure>
            <div className="lora-gallery-lightbox__media">
              <SmartImage src={activeItem.src} alt={activeItem.alt} mode="contain" priority />
            </div>
            <figcaption>
              <span>{activeItem.collectionTitle}</span>
              <strong>{activeItem.title}</strong>
              {activeItem.text ? <p>{activeItem.text}</p> : null}
            </figcaption>
          </figure>
          <button type="button" className="lora-gallery-lightbox__nav lora-gallery-lightbox__nav--next" onClick={next} aria-label="Next image">
            <ChevronRight size={28} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
