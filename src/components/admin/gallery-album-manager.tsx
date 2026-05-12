"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadAdminImage, type UploadedAsset } from "@/lib/admin-upload";
import { cn } from "@/lib/utils";

type MediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

function SmartImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} unoptimized={src.startsWith("http")} />;
}

type GalleryImage = {
  id: string;
  alt: string;
  caption?: string | null;
  sortOrder: number;
  mediaAsset: MediaAsset;
};

type GalleryCollection = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  description?: string | null;
  sortOrder: number;
  status: string;
  images: GalleryImage[];
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GalleryAlbumManager({
  initialCollections,
  mediaAssets,
}: {
  initialCollections: GalleryCollection[];
  mediaAssets: MediaAsset[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState(initialCollections[0]?.id ?? "");
  const [assets, setAssets] = useState<MediaAsset[]>(mediaAssets);
  const [status, setStatus] = useState("");
  const [newAlbum, setNewAlbum] = useState({ title: "", slug: "", locale: "EN", description: "" });
  const [imageText, setImageText] = useState<Record<string, { alt: string; caption: string }>>(
    Object.fromEntries(
      initialCollections.flatMap((collection) =>
        collection.images.map((image) => [image.id, { alt: image.alt, caption: image.caption ?? "" }]),
      ),
    ),
  );
  const active = collections.find((collection) => collection.id === activeId) ?? collections[0];
  const isFamousFigures = active?.slug === "famous-figures";

  async function createAlbum() {
    setStatus("Creating album...");
    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: newAlbum.locale,
        title: newAlbum.title,
        slug: newAlbum.slug || makeSlug(newAlbum.title),
        description: newAlbum.description,
        sortOrder: collections.length + 1,
        status: "PUBLISHED",
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Create failed");
      return;
    }
    setCollections((current) => [{ ...json, images: [] }, ...current]);
    setActiveId(json.id);
    setNewAlbum({ title: "", slug: "", locale: "EN", description: "" });
    setStatus("Album created");
  }

  async function addImage(asset: MediaAsset) {
    if (!active) return;
    setStatus("Adding image...");
    const response = await fetch(`/api/admin/gallery/${active.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaAssetId: asset.id,
        alt: asset.alt ?? active.title,
        caption: asset.caption ?? asset.alt ?? active.title,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Add failed");
      return;
    }
    setCollections((current) =>
      current.map((collection) =>
        collection.id === active.id ? { ...collection, images: [...collection.images, json] } : collection,
      ),
    );
    setImageText((current) => ({ ...current, [json.id]: { alt: json.alt, caption: json.caption ?? "" } }));
    setStatus("Image added");
  }

  async function saveImageText(imageId: string) {
    const nextText = imageText[imageId];
    if (!nextText) return;
    setStatus("Saving image text...");
    const response = await fetch(`/api/admin/gallery/images/${imageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextText),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Save failed");
      return;
    }
    setCollections((current) =>
      current.map((collection) =>
        collection.id === active?.id
          ? {
              ...collection,
              images: collection.images.map((image) =>
                image.id === imageId ? { ...image, alt: json.alt, caption: json.caption } : image,
              ),
            }
          : collection,
      ),
    );
    setStatus("Image text saved");
  }

  async function uploadAndAdd(file: File) {
    if (!active) return;
    try {
      setStatus("Uploading image...");
      const uploaded = await uploadAdminImage(file, active.title, active.title);
      const asset = uploaded as UploadedAsset & MediaAsset;
      setAssets((current) => [asset, ...current]);
      await addImage(asset);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Upload failed.");
    }
  }

  async function uploadManyAndAdd(files: File[]) {
    if (!active || files.length === 0) return;
    for (const [index, file] of files.entries()) {
      setStatus(`Uploading ${index + 1} / ${files.length} to ${active.title}...`);
      await uploadAndAdd(file);
    }
    setStatus(`Uploaded ${files.length} image${files.length === 1 ? "" : "s"} to ${active.title}`);
  }

  async function removeImage(imageId: string) {
    if (!active) return;
    setStatus("Removing image...");
    const response = await fetch(`/api/admin/gallery/images/${imageId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Remove failed");
      return;
    }
    setCollections((current) =>
      current.map((collection) =>
        collection.id === active.id ? { ...collection, images: collection.images.filter((image) => image.id !== imageId) } : collection,
      ),
    );
    setStatus("Image removed");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="grid content-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Gallery Manager</p>
          <h1 className="mt-3 text-3xl font-medium">Albums</h1>
          <p className="mt-3 text-sm leading-6 text-white/48">Click an album. Click images to add them. No code.</p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Albums</CardTitle>
            <CardDescription className="text-white/45">{collections.length} albums</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => setActiveId(collection.id)}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  collection.id === active?.id
                    ? "border-white/35 bg-white/12 text-white"
                    : "border-white/10 bg-black/20 text-white/62 hover:border-white/24 hover:text-white",
                )}
              >
                <span className="block text-sm font-medium">{collection.title}</span>
                <span className="mt-1 block text-xs text-white/38">
                  {collection.locale} / {collection.images.length} images
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>New album</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label className="text-white/55">Language</Label>
            <select
              value={newAlbum.locale}
              onChange={(event) => setNewAlbum((current) => ({ ...current, locale: event.target.value }))}
              className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
            >
              <option value="EN">English</option>
              <option value="AR">Arabic</option>
            </select>
            <Label className="text-white/55">Title</Label>
            <Input
              value={newAlbum.title}
              onChange={(event) => setNewAlbum((current) => ({ ...current, title: event.target.value, slug: current.slug || makeSlug(event.target.value) }))}
              className="border-white/15 bg-white/8 text-white"
            />
            <Label className="text-white/55">Description</Label>
            <Textarea
              value={newAlbum.description}
              onChange={(event) => setNewAlbum((current) => ({ ...current, description: event.target.value }))}
              className="border-white/15 bg-white/8 text-white"
            />
            <Button type="button" variant="admin" onClick={createAlbum}>
              Create album
            </Button>
            <span className="text-sm text-white/45">{status}</span>
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-6">
        {active ? (
          <>
            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle>{active.title}</CardTitle>
                <CardDescription className="text-white/45">
                  {isFamousFigures ? "Famous Figures text editor: each picture has its own name/title and text." : active.description}
                </CardDescription>
              </CardHeader>
              <CardContent className={isFamousFigures ? "grid gap-4" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
                {active.images.map((image) =>
                  isFamousFigures ? (
                    <article key={image.id} className="grid gap-4 rounded-md border border-white/10 bg-black/30 p-4 md:grid-cols-[180px_1fr]">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                        <SmartImage src={image.mediaAsset.url} alt={image.alt} sizes="180px" />
                      </div>
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <Label className="text-white/55">Name or title</Label>
                          <Input
                            value={imageText[image.id]?.alt ?? image.alt}
                            onChange={(event) =>
                              setImageText((current) => ({
                                ...current,
                                [image.id]: { alt: event.target.value, caption: current[image.id]?.caption ?? image.caption ?? "" },
                              }))
                            }
                            placeholder="Famous figure name"
                            className="border-white/15 bg-white/8 text-white"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-white/55">Text for this famous figure</Label>
                          <Textarea
                            value={imageText[image.id]?.caption ?? image.caption ?? ""}
                            onChange={(event) =>
                              setImageText((current) => ({
                                ...current,
                                [image.id]: { alt: current[image.id]?.alt ?? image.alt, caption: event.target.value },
                              }))
                            }
                            placeholder="Write the text shown when this picture is opened."
                            className="min-h-28 border-white/15 bg-white/8 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="admin" size="sm" onClick={() => saveImageText(image.id)}>
                            Save text
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeImage(image.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <figure key={image.id} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
                      <div className="relative aspect-[4/3]">
                        <SmartImage src={image.mediaAsset.url} alt={image.alt} sizes="25vw" />
                      </div>
                      <figcaption className="grid gap-3 p-3">
                        <Input
                          value={imageText[image.id]?.alt ?? image.alt}
                          onChange={(event) =>
                            setImageText((current) => ({
                              ...current,
                              [image.id]: { alt: event.target.value, caption: current[image.id]?.caption ?? image.caption ?? "" },
                            }))
                          }
                          placeholder="Name or title"
                          className="border-white/15 bg-white/8 text-white"
                        />
                        <Textarea
                          value={imageText[image.id]?.caption ?? image.caption ?? ""}
                          onChange={(event) =>
                            setImageText((current) => ({
                              ...current,
                              [image.id]: { alt: current[image.id]?.alt ?? image.alt, caption: event.target.value },
                            }))
                          }
                          placeholder="Text for this picture"
                          className="min-h-24 border-white/15 bg-white/8 text-white"
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="admin" size="sm" onClick={() => saveImageText(image.id)}>
                            Save text
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeImage(image.id)}>
                            Remove
                          </Button>
                        </div>
                      </figcaption>
                    </figure>
                  ),
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle>Add images</CardTitle>
                <CardDescription className="text-white/45">Upload directly into this album or click an existing image below.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void uploadManyAndAdd(Array.from(event.dataTransfer.files ?? []));
                  }}
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/20 bg-black/25 px-4 py-6 text-center text-white/55 transition hover:border-white/40 hover:text-white"
                >
                  <span className="text-sm font-medium">Drop images here or click to upload to {active.title}</span>
                  <span className="mt-1 text-xs text-white/38">JPG, PNG, WebP, GIF. Max 50 MB.</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      event.target.value = "";
                      void uploadManyAndAdd(files);
                    }}
                  />
                </label>

                <div className="grid max-h-[720px] gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-6">
                {assets.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => addImage(asset)} className="overflow-hidden rounded-md border border-white/10 bg-black/30 text-left hover:border-white/35">
                    <div className="relative aspect-square">
                      <SmartImage src={asset.url} alt={asset.alt ?? "Media"} sizes="160px" />
                    </div>
                    <span className="block truncate px-2 py-2 text-xs text-white/55">{asset.caption ?? asset.alt ?? "Image"}</span>
                  </button>
                ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
