"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Asset = {
  id: string;
  url?: string;
  src?: string;
  alt?: string | null;
  caption?: string | null;
};

export function MediaLibraryManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) return;
    setStatus("Uploading...");
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt || file.name);

    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Upload failed");
      return;
    }
    setAssets((current) => [json, ...current]);
    setFile(null);
    setAlt("");
    setStatus("Uploaded");
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Media Library</p>
        <h1 className="mt-3 text-4xl font-medium">Cloudinary media control</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Upload media and reuse URLs in section content, settings, galleries, events, projects, and members.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription className="text-white/45">Requires Cloudinary environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="border-white/15 bg-white/8 text-white" />
          <Input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Alt text" className="border-white/15 bg-white/8 text-white" />
          <div className="flex items-center gap-3">
            <Button type="button" variant="admin" onClick={upload}>
              Upload
            </Button>
            <span className="text-sm text-white/45">{status}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription className="text-white/45">{assets.length} assets</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset) => {
            const src = asset.url ?? asset.src ?? "";
            return (
              <figure key={asset.id ?? src} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
                <div className="relative aspect-[4/3]">
                  {src ? <Image src={src} alt={asset.alt ?? "Media asset"} fill className="object-cover" sizes="25vw" /> : null}
                </div>
                <figcaption className="grid gap-1 p-3 text-sm text-white/60">
                  <span>{asset.caption ?? asset.alt ?? "Untitled asset"}</span>
                  <code className="truncate text-xs text-white/35">{src}</code>
                </figcaption>
              </figure>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
