"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { CmsImage } from "@/types/cms";

type ProfileCard = {
  image: string;
  title: string;
  description: string;
};

function toProfiles(images: CmsImage[]): ProfileCard[] {
  return images.map((image, index) => ({
    image: image.src,
    title: image.alt || `Profile ${index + 1}`,
    description: image.caption ?? image.alt ?? "",
  }));
}

export function ProfileCardGallery({ images }: { images: CmsImage[] }) {
  const profiles = toProfiles(images);
  const [activeIndex, setActiveIndex] = useState(0);

  if (profiles.length === 0) {
    return (
      <div className="mx-auto flex h-[360px] max-w-3xl items-center justify-center rounded-xl border border-dashed border-black/20 bg-white/35 text-black/45">
        No profiles available
      </div>
    );
  }

  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-semibold text-black">Famous Figures</h2>
        <p className="mt-2 text-sm leading-6 text-black/55">
          A visual collection of people connected to Luweibdeh memory, culture, and public life.
        </p>
      </div>

      <div className="mx-auto mt-10 flex h-[400px] w-full max-w-5xl items-center gap-2 overflow-x-auto px-4">
        {profiles.map((profile, index) => {
          const active = activeIndex === index;

          return (
            <button
              key={`${profile.image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "group relative h-[400px] w-24 min-w-24 flex-grow overflow-hidden rounded-lg text-left transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                active && "w-full min-w-[220px]",
              )}
              aria-label={profile.title}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-full w-full object-cover object-top" src={profile.image} alt={profile.title} draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 p-4 text-white transition-all duration-500",
                  active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
                )}
              >
                <h3 className="line-clamp-1 text-lg font-semibold leading-tight">{profile.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-white/76">{profile.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
