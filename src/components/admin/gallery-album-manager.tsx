"use client";

import Image from "next/image";
import { useState } from "react";

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

export function GalleryAlbumManager({
  initialCollections,
  mediaAssets,
}: {
  initialCollections: GalleryCollection[];
  mediaAssets: MediaAsset[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState(initialCollections[0]?.id ?? "");
  const [assets] = useState(mediaAssets);
  const [status, setStatus] = useState("");
  const [newAlbum, setNewAlbum] = useState({ title: "", slug: "", locale: "EN", description: "" });
  const active = collections.find((collection) => collection.id === activeId) ?? collections[0];

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
    setStatus("Image added");
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
                <CardDescription className="text-white/45">{active.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {active.images.map((image) => (
                  <figure key={image.id} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
                    <div className="relative aspect-[4/3]">
                      <Image src={image.mediaAsset.url} alt={image.alt} fill className="object-cover" sizes="25vw" />
                    </div>
                    <figcaption className="grid gap-2 p-3">
                      <span className="truncate text-sm text-white/62">{image.caption ?? image.alt}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeImage(image.id)}>
                        Remove
                      </Button>
                    </figcaption>
                  </figure>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle>Add images</CardTitle>
                <CardDescription className="text-white/45">Click an image to add it to this album.</CardDescription>
              </CardHeader>
              <CardContent className="grid max-h-[720px] gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-6">
                {assets.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => addImage(asset)} className="overflow-hidden rounded-md border border-white/10 bg-black/30 text-left hover:border-white/35">
                    <div className="relative aspect-square">
                      <Image src={asset.url} alt={asset.alt ?? "Media"} fill className="object-cover" sizes="160px" />
                    </div>
                    <span className="block truncate px-2 py-2 text-xs text-white/55">{asset.caption ?? asset.alt ?? "Image"}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
