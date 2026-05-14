"use client";

import Image from "next/image";
import { useState } from "react";

import { DriveImagePicker, type DriveMediaAsset } from "@/components/admin/drive-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HeroSection = {
  id: string;
  isStarter?: boolean;
  pageTitle: string;
  pageSlug: string;
  locale: string;
  title: string;
  type: string;
  variant: string;
  sortOrder: number;
  isVisible: boolean;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
};

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sectionImages(section: HeroSection) {
  const frames = stringList(section.settings.heroScrubFrames);
  const image = stringValue(section.content.image);
  return frames.length > 0 ? frames : image ? [image] : [];
}

function SmartImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("http")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill sizes="220px" className="object-cover" />;
}

export function HeroPicsManager({
  initialSections,
  mediaAssets,
  folderId,
}: {
  initialSections: HeroSection[];
  mediaAssets: DriveMediaAsset[];
  folderId?: string;
}) {
  const [sections, setSections] = useState(initialSections);
  const [status, setStatus] = useState<Record<string, string>>({});

  function updateImages(sectionId: string, images: string[]) {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content: { ...section.content, image: images[0] ?? "" },
              settings: { ...section.settings, heroScrubFrames: images },
            }
          : section,
      ),
    );
  }

  async function save(section: HeroSection) {
    setStatus((current) => ({ ...current, [section.id]: "Saving..." }));
    const response = await fetch(`/api/admin/hero-pics/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: section.type,
        variant: section.variant,
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
        content: section.content,
        settings: section.settings,
      }),
    });
    const json = await response.json();
    setStatus((current) => ({ ...current, [section.id]: response.ok ? "Saved." : json.error ?? "Save failed." }));
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Hero Gallery</p>
        <h1 className="mt-3 text-4xl font-medium">Hero gallery</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
          Hero pictures come from the Google Drive hero folder. Add files to Drive, sync, choose images, then save.
        </p>
      </div>

      <div className="grid gap-5">
        {sections.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>No hero sections found</CardTitle>
              <CardDescription className="text-white/45">
                No CMS pages exist in the database yet. Create or seed a page first, then hero pictures will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {sections.map((section) => {
          const images = sectionImages(section);
          return (
            <Card key={section.id} className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{section.pageTitle}</CardTitle>
                    <CardDescription className="text-white/45">
                      {section.locale} / {section.pageSlug || "home"} / {section.title || "Hero section"}
                      {section.isStarter ? " / starter content" : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/45">{status[section.id]}</span>
                    <Button type="button" variant="admin" onClick={() => save(section)}>
                      Save hero pics
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
                {images.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {images.map((src, index) => (
                      <figure key={`${section.id}-${src}-${index}`} className="overflow-hidden rounded-md border border-white/10 bg-black/20">
                        <div className="relative aspect-[4/3]">
                          <SmartImage src={src} alt={`Hero picture ${index + 1}`} />
                        </div>
                        <figcaption className="flex flex-wrap gap-2 p-3">
                          <Button type="button" variant="outline" size="sm" onClick={() => updateImages(section.id, images.filter((_, itemIndex) => itemIndex !== index))}>
                            Remove
                          </Button>
                          <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => updateImages(section.id, images.toSpliced(index - 1, 2, images[index], images[index - 1]))}>
                            Up
                          </Button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-white/50">No hero pictures selected.</p>
                )}

                <DriveImagePicker
                  assets={mediaAssets}
                  selectedUrls={images}
                  folderId={folderId}
                  title="Choose from Drive hero folder"
                  description="Only pictures inside the Google Drive hero folder appear here."
                  emptyMessage="The Drive hero folder has no synced pictures. Add pictures to Google Drive, then click Sync Drive."
                  onPick={(asset) => updateImages(section.id, [...images, asset.url])}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
