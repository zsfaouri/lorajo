"use client";

import { Folder, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Asset = {
  id: string;
  url?: string;
  src?: string;
  alt?: string | null;
  caption?: string | null;
  metadata?: unknown;
};

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  type: "folder" | "image";
  url: string | null;
  thumbnailUrl: string | null;
};

const categoryOptions = [
  { label: "Hero Pics", value: "hero-pics" },
  { label: "Who We Are", value: "who-we-are" },
  { label: "Photo Gallery", value: "photo-gallery" },
  { label: "Famous Figures", value: "famous-figures" },
  { label: "Founding Members", value: "founding-members" },
  { label: "Events", value: "events" },
  { label: "Announcements", value: "announcements" },
  { label: "Projects", value: "projects" },
  { label: "Articles", value: "articles" },
  { label: "Other", value: "other" },
];

function getCategory(asset: Asset) {
  const metadata = asset.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "Unsorted";
  const category = "category" in metadata ? metadata.category : null;
  return typeof category === "string" && category.trim() ? category.trim() : "Unsorted";
}

function SmartImage({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} fill className="object-cover" sizes="25vw" unoptimized />;
}

export function MediaLibraryManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [folderId, setFolderId] = useState("");
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<DriveItem | null>(null);
  const [alt, setAlt] = useState("");
  const [category, setCategory] = useState(categoryOptions[0].value);
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");
  const categories = ["All", ...Array.from(new Set(assets.map(getCategory))).sort()];
  const visibleAssets = filter === "All" ? assets : assets.filter((asset) => getCategory(asset) === filter);

  async function loadFolder(nextFolderId = "") {
    setStatus("Loading Google Drive...");
    const response = await fetch(nextFolderId ? `/api/admin/drive?folderId=${encodeURIComponent(nextFolderId)}` : "/api/admin/drive");
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Could not load Google Drive.");
      setDriveItems([]);
      return;
    }
    setFolderId(json.folderId);
    setDriveItems(json.items ?? []);
    setSelected(null);
    setStatus("");
  }

  useEffect(() => {
    void loadFolder();
  }, []);

  function openFolder(item: DriveItem) {
    setFolderStack((current) => [...current, { id: folderId, name: "Back" }]);
    void loadFolder(item.id);
  }

  function goBack() {
    const previous = folderStack.at(-1);
    if (!previous) return;
    setFolderStack((current) => current.slice(0, -1));
    void loadFolder(previous.id);
  }

  async function addSelectedImage() {
    if (!selected) return;
    try {
      setStatus("Adding selected Drive image...");
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveFileId: selected.id,
          driveFileName: selected.name,
          driveMimeType: selected.mimeType,
          alt: alt || selected.name,
          category,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not add selected image.");
      setAssets((current) => [json, ...current.filter((asset) => asset.id !== json.id)]);
      setSelected(null);
      setAlt("");
      setStatus("Image added from Google Drive.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Could not add selected image.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Media Cloud</p>
        <h1 className="mt-3 text-4xl font-medium">Google Drive pictures</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Select pictures directly from the connected Google Drive folders. Local upload and pasted links are disabled.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Choose from Google Drive</CardTitle>
          <CardDescription className="text-white/45">Open folders, select one image, choose where it belongs, then add it to the website.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={goBack} disabled={folderStack.length === 0}>
              Back
            </Button>
            <span className="text-sm text-white/45">{status || `${driveItems.length} Drive items`}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {driveItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.type === "folder" ? openFolder(item) : setSelected(item))}
                className={`overflow-hidden rounded-md border bg-black/30 text-left transition ${selected?.id === item.id ? "border-white" : "border-white/10 hover:border-white/35"}`}
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-white/5">
                  {item.type === "folder" ? <Folder className="h-10 w-10 text-white/55" /> : item.thumbnailUrl ? <SmartImage src={item.thumbnailUrl} alt={item.name} /> : <ImageIcon className="h-10 w-10 text-white/55" />}
                </div>
                <span className="block truncate p-3 text-sm text-white/70">{item.name}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <Input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder={selected?.name ?? "Alt text"} className="border-white/15 bg-white/8 text-white" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-white/15 bg-white px-3 text-sm text-black">
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white text-black">
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="admin" onClick={addSelectedImage} disabled={!selected}>
              Add Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Website pictures</CardTitle>
          <CardDescription className="text-white/45">
            {visibleAssets.length} shown / {assets.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs ${filter === item ? "border-white bg-white text-black" : "border-white/10 text-white/55"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleAssets.map((asset) => {
              const src = asset.url ?? asset.src ?? "";
              return (
                <figure key={asset.id ?? src} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
                  <div className="relative aspect-[4/3]">{src ? <SmartImage src={src} alt={asset.alt ?? "Media asset"} /> : null}</div>
                  <figcaption className="grid gap-1 p-3 text-sm text-white/60">
                    <span>{asset.caption ?? asset.alt ?? "Untitled asset"}</span>
                    <span className="text-xs uppercase tracking-[0.12em] text-white/35">{getCategory(asset)}</span>
                    <span className="text-xs text-white/35">Google Drive</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
