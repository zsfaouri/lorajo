"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadAdminImage } from "@/lib/admin-upload";

type Asset = {
  id: string;
  url?: string;
  src?: string;
  alt?: string | null;
  caption?: string | null;
  metadata?: unknown;
};

function getCategory(asset: Asset) {
  const metadata = asset.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "Unsorted";
  const category = "category" in metadata ? metadata.category : null;
  return typeof category === "string" && category.trim() ? category.trim() : "Unsorted";
}

function SmartImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" sizes="25vw" unoptimized={src.startsWith("http")} />;
}

export function MediaLibraryManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [files, setFiles] = useState<File[]>([]);
  const [alt, setAlt] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("All");
  const [status, setStatus] = useState("");
  const categories = ["All", ...Array.from(new Set(assets.map(getCategory))).sort()];
  const visibleAssets = filter === "All" ? assets : assets.filter((asset) => getCategory(asset) === filter);

  async function upload() {
    if (files.length === 0) return;
    try {
      const uploaded: Asset[] = [];
      for (const [index, selectedFile] of files.entries()) {
        setStatus(`Uploading ${index + 1} / ${files.length}...`);
        uploaded.push(await uploadAdminImage(selectedFile, alt || selectedFile.name, category));
      }
      setAssets((current) => [...uploaded.reverse(), ...current]);
      setFiles([]);
      setAlt("");
      setStatus(`Uploaded ${uploaded.length} image${uploaded.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Upload failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Media Cloud</p>
        <h1 className="mt-3 text-4xl font-medium">Image cloud</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Bulk upload images, assign a category, then reuse the same assets in pages, gallery albums, events, announcements, and members.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Bulk upload</CardTitle>
          <CardDescription className="text-white/45">JPG, PNG, WebP, or GIF. Large files are allowed; storage provider limits still apply.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-end">
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="border-white/15 bg-white/8 text-white"
          />
          <Input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Alt text" className="border-white/15 bg-white/8 text-white" />
          <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" className="border-white/15 bg-white/8 text-white" />
          <div className="flex items-center gap-3">
            <Button type="button" variant="admin" onClick={upload}>
              Upload {files.length > 0 ? files.length : ""}
            </Button>
            <span className="text-sm text-white/45">{status}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription className="text-white/45">{visibleAssets.length} shown / {assets.length} total</CardDescription>
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
                <div className="relative aspect-[4/3]">
                  {src ? <SmartImage src={src} alt={asset.alt ?? "Media asset"} /> : null}
                </div>
                <figcaption className="grid gap-1 p-3 text-sm text-white/60">
                  <span>{asset.caption ?? asset.alt ?? "Untitled asset"}</span>
                  <span className="text-xs uppercase tracking-[0.12em] text-white/35">{getCategory(asset)}</span>
                  <span className="text-xs text-white/35">Stored in media cloud</span>
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
