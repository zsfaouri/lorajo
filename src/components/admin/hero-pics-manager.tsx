"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadAdminImage, type UploadedAsset } from "@/lib/admin-upload";

type MediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

type HeroSection = {
  id: string;
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
}: {
  initialSections: HeroSection[];
  mediaAssets: MediaAsset[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [assets, setAssets] = useState(mediaAssets);
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

  async function upload(sectionId: string, files: FileList | null) {
    if (!files?.length) return;
    setStatus((current) => ({ ...current, [sectionId]: "Uploading..." }));
    try {
      const uploaded: UploadedAsset[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadAdminImage(file, file.name, "Hero Pics"));
      }
      const nextAssets: MediaAsset[] = uploaded.flatMap((asset) => {
        const url = asset.url ?? asset.src ?? "";
        return url ? [{ id: asset.id, url, alt: asset.alt, caption: asset.caption }] : [];
      });
      setAssets((current) => [...nextAssets, ...current]);
      const section = sections.find((item) => item.id === sectionId);
      updateImages(sectionId, [...(section ? sectionImages(section) : []), ...nextAssets.map((asset) => asset.url)]);
      setStatus((current) => ({ ...current, [sectionId]: "Uploaded. Click save." }));
    } catch (caught) {
      setStatus((current) => ({ ...current, [sectionId]: caught instanceof Error ? caught.message : "Upload failed." }));
    }
  }

  async function save(section: HeroSection) {
    setStatus((current) => ({ ...current, [section.id]: "Saving..." }));
    const response = await fetch(`/api/admin/sections/${section.id}`, {
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
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Hero Pics</p>
        <h1 className="mt-3 text-4xl font-medium">Hero pictures</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
          Change homepage and page hero images from one place. Upload new pictures or pick from Media Cloud.
        </p>
      </div>

      <div className="grid gap-5">
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
                <label className="grid min-h-28 cursor-pointer place-items-center rounded-md border border-dashed border-white/20 bg-black/20 p-4 text-center">
                  <span className="text-sm text-white/60">Click to upload hero pictures</span>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-3 max-w-md border-white/15 bg-white/8 text-white"
                    onChange={(event) => {
                      void upload(section.id, event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>

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

                <div className="grid gap-3">
                  <p className="text-sm font-medium">Pick from Media Cloud</p>
                  <div className="grid max-h-[460px] gap-3 overflow-auto sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => updateImages(section.id, [...images, asset.url])}
                        className="overflow-hidden rounded-md border border-white/10 bg-black/20 text-left transition hover:border-[var(--color-heritage-green)]"
                      >
                        <div className="relative aspect-square">
                          <SmartImage src={asset.url} alt={asset.alt ?? "Media image"} />
                        </div>
                        <span className="block truncate px-2 py-2 text-xs text-white/55">{asset.alt ?? "Image"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
