"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Plus, RefreshCw } from "lucide-react";

import { DriveImagePicker, type DriveMediaAsset } from "@/components/admin/drive-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { canonicalGallerySlug } from "@/lib/gallery-slugs";
import { cn } from "@/lib/utils";

const DRIVE_ROOT_URL = "https://drive.google.com/drive/folders/1JPsc0Lp5TbxU6AoO093NVgyJYaYVmK6v";

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

type NewProfileForm = {
  asset: DriveMediaAsset | null;
  alt: string;
  caption: string;
};

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

function collectionIdFromSlug(collections: GalleryCollection[], slug: string | null) {
  const requestedSlug = canonicalGallerySlug(slug ?? "");
  return collections.find((collection) => canonicalGallerySlug(collection.slug) === requestedSlug)?.id ?? collections[0]?.id ?? "";
}

const emptyNewProfile: NewProfileForm = { asset: null, alt: "", caption: "" };

export function GalleryAlbumManager({ initialCollections, mediaAssets = [] }: { initialCollections: GalleryCollection[]; mediaAssets?: MediaAsset[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedFolder = searchParams.get("folder");
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState(() => collectionIdFromSlug(initialCollections, requestedFolder));
  const [status, setStatus] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newProfile, setNewProfile] = useState<NewProfileForm>(emptyNewProfile);
  const [imageText, setImageText] = useState<Record<string, { alt: string; caption: string }>>(initialImageText(initialCollections));
  const active = useMemo(() => collections.find((collection) => collection.id === activeId) ?? collections[0], [activeId, collections]);
  const activeIsFamousFigures = active?.slug === "famous-figures";

  useEffect(() => {
    if (!requestedFolder) return;
    const requestedId = collectionIdFromSlug(collections, requestedFolder);
    if (requestedId) setActiveId(requestedId);
  }, [collections, requestedFolder]);

  function openCollection(collection: GalleryCollection) {
    setActiveId(collection.id);
    setNewProfile(emptyNewProfile);
    router.replace(`/admin/media?folder=${collection.slug}`, { scroll: false });
  }

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
    setNewProfile(emptyNewProfile);
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

  async function createDriveFolder() {
    const name = newFolderName.trim();
    if (!name) {
      setStatus("Folder name is required.");
      return;
    }

    setStatus("Creating Google Drive folder...");
    const response = await fetch("/api/admin/drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Could not create Drive folder.");
      return;
    }

    setNewFolderName("");
    await syncDrive();
    setStatus(`Created Drive folder: ${json.name ?? name}`);
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

  async function addProfile() {
    if (!active) return;
    if (!newProfile.asset) {
      setStatus("Choose a Google Drive image first.");
      return;
    }
    if (active.images.some((image) => image.mediaAsset.id === newProfile.asset?.id)) {
      setStatus(activeIsFamousFigures ? "This profile picture is already in the tab." : "This image is already in the tab.");
      return;
    }

    const alt = newProfile.alt.trim() || newProfile.asset.alt || newProfile.asset.caption || "Famous figure";
    if (!alt.trim()) {
      setStatus("Name / title is required.");
      return;
    }

    setStatus(activeIsFamousFigures ? "Adding profile..." : "Adding image...");
    const response = await fetch(`/api/admin/gallery/${active.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaAssetId: newProfile.asset.id,
        alt,
        caption: newProfile.caption.trim() || null,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? (activeIsFamousFigures ? "Could not add profile." : "Could not add image."));
      return;
    }

    setCollections((current) =>
      current.map((collection) =>
        collection.id === active.id ? { ...collection, images: [...collection.images, json] } : collection,
      ),
    );
    setImageText((current) => ({ ...current, [json.id]: { alt: json.alt, caption: json.caption ?? "" } }));
    setNewProfile(emptyNewProfile);
    setStatus(activeIsFamousFigures ? "Profile added." : "Image added.");
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
          <h1 className="mt-3 text-4xl font-medium">Image Cloud</h1>
          <p className="mt-3 text-sm leading-6 text-black/58">
            Google Drive is the image database. Photo Gallery folders appear here. Hero images are managed in Hero Gallery.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Source of truth</CardTitle>
            <CardDescription>Create folders and upload pictures in Google Drive. Click sync to pull them into the admin editor.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button type="button" variant="green" onClick={syncDrive} className="justify-center gap-2">
              <RefreshCw size={16} />
              Sync Google Drive
            </Button>
            <a
              href={DRIVE_ROOT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-heritage-green)] px-5 text-sm font-medium text-[var(--color-heritage-green)] transition-colors hover:bg-[var(--color-heritage-green)] hover:text-white"
            >
              <ExternalLink size={16} />
              Open Drive Folder
            </a>
            <p className="text-sm text-black/55">{status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add folder</CardTitle>
            <CardDescription>Create a Drive folder category, then upload pictures into it from Google Drive.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Folder name" />
            <Button type="button" variant="green" onClick={createDriveFolder}>
              Add Drive folder
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website tabs</CardTitle>
            <CardDescription>{collections.length} Drive folders synced</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => openCollection(collection)}
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
            <CardTitle>Category rule</CardTitle>
            <CardDescription>No manual database categories. Folder equals tab.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-6 text-black/60">
            <p>Example: a Drive folder named Famous Figures becomes the Famous Figures website tab.</p>
            <p>Upload images inside that folder, then press Sync Google Drive. Hero stays out of Photo Gallery.</p>
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-6">
        {active ? (
          <Card>
            <CardHeader>
              <CardTitle>{active.title}</CardTitle>
              <CardDescription>
                This tab is powered by its matching Google Drive folder. Edit only the website text here.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 rounded-md border border-black/10 bg-black/[0.02] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{activeIsFamousFigures ? "Add profile" : "Add image"}</p>
                    <p className="mt-1 text-sm leading-6 text-black/55">
                      Pick a synced Google Drive image, then add the text shown on the website.
                    </p>
                  </div>
                  <Button type="button" variant="green" onClick={addProfile} className="shrink-0">
                    <Plus size={16} />
                    {activeIsFamousFigures ? "Add profile" : "Add image"}
                  </Button>
                </div>

                <DriveImagePicker
                  assets={mediaAssets}
                  selectedIds={newProfile.asset ? [newProfile.asset.id] : active.images.map((image) => image.mediaAsset.id)}
                  onPick={(asset) =>
                    setNewProfile((current) => ({
                      ...current,
                      asset,
                      alt: current.alt || asset.alt || asset.caption || "",
                    }))
                  }
                  title={activeIsFamousFigures ? "Profile picture" : "Gallery picture"}
                  description={`Choose from synced Google Drive images in ${active.title}.`}
                  category={active.slug}
                  lockCategory
                  compact
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Name / title</Label>
                    <Input
                      value={newProfile.alt}
                      onChange={(event) => setNewProfile((current) => ({ ...current, alt: event.target.value }))}
                      placeholder={activeIsFamousFigures ? "Profile name" : "Image title"}
                    />
                  </div>
                  <div className="grid gap-2 md:row-span-2">
                    <Label>Text shown on website</Label>
                    <Textarea
                      value={newProfile.caption}
                      onChange={(event) => setNewProfile((current) => ({ ...current, caption: event.target.value }))}
                      className="min-h-28"
                    />
                  </div>
                </div>
              </div>

              {active.images.length === 0 ? (
                <div className="rounded-md border border-dashed border-black/15 bg-white p-8 text-sm text-black/55">
                  No images in this tab yet. Add images to the matching Google Drive folder, then click Sync Google Drive.
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
                      <Button type="button" variant="green" size="sm" onClick={() => saveImageText(image.id)}>
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
