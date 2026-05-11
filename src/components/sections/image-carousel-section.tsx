"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SectionFrame } from "@/components/sections/section-frame";
import { Button } from "@/components/ui/button";
import { isRecord } from "@/lib/utils";
import type { CmsImage, CmsSection } from "@/types/cms";

function items(section: CmsSection): CmsImage[] {
  const source = section.content.items;
  if (!Array.isArray(source)) return [];
  return source.filter(isRecord).map((item) => ({
    src: typeof item.src === "string" ? item.src : "/lora/gallery/luweibdeh-flower.jpg",
    alt: typeof item.alt === "string" ? item.alt : "LORA carousel image",
    caption: typeof item.caption === "string" ? item.caption : undefined,
  }));
}

export function ImageCarouselSection({ section }: { section: CmsSection }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: section.settings.loop !== false, align: "center" });
  const slides = items(section);

  return (
    <SectionFrame section={section}>
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide) => (
              <div key={slide.src} className="min-w-0 flex-[0_0_82%] pl-4 md:flex-[0_0_46%]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-media)] bg-black">
                  <Image src={slide.src} alt={slide.alt} fill className="object-cover" sizes="80vw" />
                </div>
                <p className="mt-3 text-sm text-black/55">{slide.caption}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => emblaApi?.scrollPrev()} aria-label="Previous slide">
            <ChevronLeft size={18} />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => emblaApi?.scrollNext()} aria-label="Next slide">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </SectionFrame>
  );
}
