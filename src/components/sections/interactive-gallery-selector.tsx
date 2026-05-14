"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Aperture, Archive, Landmark, Leaf, Users } from "lucide-react";

import { ProfileCardGallery } from "@/components/sections/profile-card-gallery";
import { SectionFrame } from "@/components/sections/section-frame";
import { InteractiveBentoGallery } from "@/components/sections/staggered-photo-gallery-section";
import type { CmsSection, GalleryCollectionDto } from "@/types/cms";

const iconMap = [Archive, Landmark, Users, Leaf, Aperture];

type SelectorOption = {
  title: string;
  description: string;
  image: string;
  alt: string;
  imageCount: number;
};

function getOptions(collections: GalleryCollectionDto[]): SelectorOption[] {
  return collections.filter((collection) => collection.slug !== "famous-figures" && ["historical-photos", "landmarks"].includes(collection.slug)).flatMap((collection) =>
    collection.images.map((image) => ({
      title: image.caption ?? image.alt,
      description: collection.title,
      image: image.src,
      alt: image.alt,
      imageCount: collection.images.length,
    })),
  );
}

export function InteractiveGallerySelector({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);
  const options = useMemo(() => getOptions(collections), [collections]);
  const galleryCollections = collections.filter((collection) =>
    ["famous-figures", "historical-photos", "landmarks"].includes(collection.slug),
  );
  const title = typeof section.content.title === "string" ? section.content.title : "PHOTO GALLERY";
  const subtitle =
    typeof section.content.subtitle === "string"
      ? section.content.subtitle
      : "Historical photos, landmarks, and public memory from Jabal Al-Luweibdeh.";

  useEffect(() => {
    const timers = options.map((_, index) =>
      window.setTimeout(() => {
        setAnimatedOptions((previous) => (previous.includes(index) ? previous : [...previous, index]));
      }, 180 * index),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [options]);

  if (options.length === 0) return null;

  return (
    <SectionFrame section={section}>
      <div className="relative -mx-4 flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#111511] px-4 py-20 text-white sm:-mx-6 lg:-mx-8">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 18%, rgba(1,150,60,0.22), transparent 48%), linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.68))",
          }}
        />

        <div className="relative z-10 mb-12 w-full max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/48">LORA Archive</p>
          <h1 className="text-[clamp(2.7rem,7vw,5.8rem)] font-[var(--font-heading-weight)] uppercase leading-[0.9] tracking-normal text-white">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">{subtitle}</p>
        </div>

        <div className="relative z-10 flex h-auto w-full max-w-[980px] flex-col overflow-hidden border border-white/10 bg-black/25 shadow-[0_24px_90px_rgba(0,0,0,0.45)] md:h-[430px] md:min-w-[680px] md:flex-row">
          {options.map((option, index) => {
            const active = activeIndex === index;
            const Icon = iconMap[index % iconMap.length];

            return (
              <button
                key={`${option.title}-${option.image}`}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveIndex(index)}
                className="group relative flex min-h-[190px] flex-col justify-end overflow-hidden text-left outline-none transition-all duration-700 ease-in-out focus-visible:ring-2 focus-visible:ring-white md:min-h-[100px]"
                style={{
                  opacity: animatedOptions.includes(index) ? 1 : 0,
                  transform: animatedOptions.includes(index) ? "translateX(0)" : "translateX(-60px)",
                  flex: active ? "7 1 0%" : "1 1 0%",
                  zIndex: active ? 10 : 1,
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: active ? "#f2faf6" : "#292929",
                  boxShadow: active ? "0 20px 60px rgba(0,0,0,0.50)" : "0 10px 30px rgba(0,0,0,0.30)",
                  willChange: "flex-grow, box-shadow",
                }}
              >
                <Image
                  src={option.image}
                  alt={option.alt}
                  fill
                  sizes="(min-width: 768px) 980px, 100vw"
                  className="object-cover transition duration-700 ease-in-out"
                  style={{
                    transform: active ? "scale(1)" : "scale(1.12)",
                  }}
                />
                <div className="absolute inset-0 bg-black/20 transition duration-700 group-hover:bg-black/10" />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-40 transition-all duration-700 ease-in-out"
                  style={{
                    boxShadow: active
                      ? "inset 0 -140px 120px -80px #000, inset 0 -80px 90px -60px #000"
                      : "inset 0 -120px 80px -100px #000",
                  }}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex h-14 items-center justify-start gap-3 px-4">
                  <div className="flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-white/18 bg-black/70 text-white shadow-[0_1px_4px_rgba(0,0,0,0.18)] backdrop-blur-md">
                    <Icon size={21} />
                  </div>
                  <div className="relative min-w-0 text-white">
                    <div
                      className="whitespace-nowrap text-lg font-bold transition-all duration-700 ease-in-out"
                      style={{
                        opacity: active ? 1 : 0,
                        transform: active ? "translateX(0)" : "translateX(25px)",
                      }}
                    >
                      {option.title}
                    </div>
                    <div
                      className="whitespace-nowrap text-sm text-white/70 transition-all duration-700 ease-in-out"
                      style={{
                        opacity: active ? 1 : 0,
                        transform: active ? "translateX(0)" : "translateX(25px)",
                      }}
                    >
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 mt-16 w-full max-w-7xl space-y-14">
          {galleryCollections.map((collection) => (
            <section key={collection.id} aria-label={collection.title}>
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/12 pb-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-[var(--font-heading-weight)] uppercase tracking-[0.08em] text-white md:text-3xl">
                    {collection.title}
                  </h2>
                  {collection.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">{collection.description}</p>
                  ) : null}
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-white/38">{collection.images.length} images</span>
              </div>

              {collection.slug === "famous-figures" ? (
                <div className="bg-white px-4 py-8 md:px-8">
                  <ProfileCardGallery images={collection.images} />
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white px-4 py-8 text-black md:px-8">
                  <InteractiveBentoGallery
                    images={collection.images.map((image) => ({
                      ...image,
                      caption: image.caption ?? collection.title,
                    }))}
                    title={collection.title}
                  />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}
