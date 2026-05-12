"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

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

function SmartImage({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 50vw" unoptimized />;
}

function initialImageText(collections: GalleryCollection[]) {
  return Object.fromEntries(
    collections.flatMap((collection) =>
      collection.images.map((image) => [image.id, { alt: image.alt, caption: image.caption ?? "" }]),
    ),
  );
}

export function GalleryAlbumManager({ initialCollections }: { initialCollections: GalleryCollection[]; mediaAssets?: MediaAsset[] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState(initialCollections[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [newCategory, setNewCategory] = useState({ title: "", slug: "", description: "" });
  const [imageText, setImageText] = useState<Record<string, { alt: string; caption: string }>>(initialImageText(initialCollections));
  const active = useMemo(() => collections.find((collection) => collection.id === activeId) ?? collections[0], [activeId, collections]);

  async function reloadCollections(nextActiveId = active?.id ?? "") {
    const response = await fetch("/api/admin/gallery", { cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Could not reload categories.");
      return;
    }
    setCollections(json);
    setImageText(initialImageText(json));
    setActiveId(nextActiveId || json[0]?.id || "");
  }

  async function syncDrive() {
    setStatus("Reading Google Drive folders...");
    const response = await fetch("/api/admin/gallery/sync-drive", { method: "POST", cache: "no-store" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Drive sync failed.");
      return;
    }
    await reloadCollections();
    setStatus(`Synced ${json.folders} folders and ${json.images} images from Google Drive.`);
  }

  async function createCategory() {
    setStatus("Creating category...");
    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "EN",
        title: newCategory.title,
        slug: newCategory.slug || makeSlug(newCategory.title),
        description: newCategory.description,
        sortOrder: collections.length + 1,
        status: "PUBLISHED",
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Create failed.");
      return;
    }
    setNewCategory({ title: "", slug: "", description: "" });
    await reloadCollections(json.id);
    setStatus("Category created. Create a Google Drive folder with the same name, add images, then sync.");
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
      setStatus(json.error ?? "Save failed.");
      return;
    }
    setCollections((current) =>
      current.map((collection) => ({
        ...collection,
        images: collection.images.map((image) => (image.id === imageId ? { ...image, alt: json.alt, caption: json.caption } : image)),
      })),
    );
    setStatus("Image text saved.");
  }

  async function removeImage(imageId: string) {
    setStatus("Removing image from this category...");
    const response = await fetch(`/api/admin/gallery/images/${imageId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Remove failed.");
      return;
    }
    setCollections((current) =>
      current.map((collection) => ({
        ...collection,
        images: collection.images.filter((image) => image.id !== imageId),
      })),
    );
    setStatus("Image removed from category. The file stays in Google Drive.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="grid content-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-black/45">Media Cloud</p>
          <h1 className="mt-3 text-4xl font-medium">Drive categories</h1>
          <p className="mt-3 text-sm leading-6 text-black/58">Each category is a website tab. Each category is filled from the matching Google Drive folder.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Google Drive sync</CardTitle>
            <CardDescription>Upload files in Drive first. Then sync here to make them editable.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button type="button" variant="admin" onClick={syncDrive} className="justify-center gap-2">
              <RefreshCw size={16} />
              Sync Google Drive
            </Button>
            <p className="text-sm text-black/55">{status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>{collections.length} website tabs</CardDescription>
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
                    ? "border-[var(--color-heritage-green)] bg-[var(--color-heritage-green)] text-white"
                    : "border-black/10 bg-white text-black/65 hover:border-[var(--color-heritage-green)]/35 hover:text-black",
                )}
              >
                <span className="block text-sm font-medium">{collection.title}</span>
                <span className={cn("mt-1 block text-xs", collection.id === active?.id ? "text-white/70" : "text-black/42")}>
                  {collection.slug} / {collection.images.length} images
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
            <CardDescription>This creates the website tab. Use the same name for the Google Drive folder.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>Category name</Label>
            <Input
              value={newCategory.title}
              onChange={(event) => setNewCategory((current) => ({ ...current, title: event.target.value, slug: current.slug || makeSlug(event.target.value) }))}
              placeholder="Famous Figures"
            />
            <Label>Website slug</Label>
            <Input value={newCategory.slug} onChange={(event) => setNewCategory((current) => ({ ...current, slug: event.target.value }))} placeholder="famous-figures" />
            <Label>Description</Label>
            <Textarea value={newCategory.description} onChange={(event) => setNewCategory((current) => ({ ...current, description: event.target.value }))} />
            <Button type="button" variant="outline" onClick={createCategory}>
              Create category
            </Button>
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-6">
        {active ? (
          <Card>
            <CardHeader>
              <CardTitle>{active.title}</CardTitle>
              <CardDescription>
                Edit the name and text for each image in this tab. The image file stays in Google Drive.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {active.images.length === 0 ? (
                <div className="rounded-md border border-dashed border-black/15 bg-white p-8 text-sm text-black/55">
                  No images in this category yet. Add images to the matching Google Drive folder, then click Sync Google Drive.
                </div>
              ) : null}

              {active.images.map((image) => (
                <article key={image.id} className="grid gap-4 rounded-md border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[180px_1fr]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black/5">
                    <SmartImage src={image.mediaAsset.url} alt={image.alt} />
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Name / title</Label>
                      <Input
                        value={imageText[image.id]?.alt ?? image.alt}
                        onChange={(event) =>
                          setImageText((current) => ({
                            ...current,
                            [image.id]: { alt: event.target.value, caption: current[image.id]?.caption ?? image.caption ?? "" },
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Text shown on website</Label>
                      <Textarea
                        value={imageText[image.id]?.caption ?? image.caption ?? ""}
                        onChange={(event) =>
                          setImageText((current) => ({
                            ...current,
                            [image.id]: { alt: current[image.id]?.alt ?? image.alt, caption: event.target.value },
                          }))
                        }
                        className="min-h-28"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="admin" size="sm" onClick={() => saveImageText(image.id)}>
                        Save text
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeImage(image.id)}>
                        Remove from tab
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
