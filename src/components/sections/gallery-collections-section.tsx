import Image from "next/image";

import { Reveal } from "@/components/sections/reveal";
import { SectionFrame } from "@/components/sections/section-frame";
import { InteractiveGallerySelector } from "@/components/sections/interactive-gallery-selector";
import { StaggeredPhotoGallerySection } from "@/components/sections/staggered-photo-gallery-section";
import type { CmsSection, GalleryCollectionDto } from "@/types/cms";

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  if (src.includes("supabase.co/storage/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />;
}

export function GalleryCollectionsSection({
  section,
  collections,
}: {
  section: CmsSection;
  collections: GalleryCollectionDto[];
}) {
  if (section.variant === "interactive_selector") {
    return <InteractiveGallerySelector section={section} collections={collections} />;
  }
  if (section.variant === "staggered_grid") {
    return <StaggeredPhotoGallerySection section={section} collections={collections} />;
  }

  return (
    <SectionFrame section={section}>
      <div className="mx-auto max-w-7xl space-y-16">
        {collections.map((collection) => (
          <Reveal key={collection.id}>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-black/12 pb-4">
              <div>
                <h2 className="text-3xl font-[var(--font-heading-weight)] uppercase tracking-[0.08em]">
                  {collection.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-black/55">{collection.description}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-black/40">{collection.images.length} images</span>
            </div>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {collection.images.map((image, index) => (
                <figure
                  key={`${collection.id}-${image.src}`}
                  className="mb-4 break-inside-avoid overflow-hidden rounded-[var(--radius-media)] bg-white"
                >
                  <div className={index % 3 === 0 ? "relative aspect-[4/5]" : "relative aspect-[5/4]"}>
                    <GalleryImage src={image.src} alt={image.alt} />
                  </div>
                  <figcaption className="px-4 py-3 text-sm text-black/58">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </SectionFrame>
  );
}
