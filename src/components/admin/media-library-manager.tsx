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
};

function SmartImage({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
  }

  return <Image src={src} alt={alt} fill className="object-cover" sizes="25vw" unoptimized={src.startsWith("http")} />;
}

export function MediaLibraryManager({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [status, setStatus] = useState("");

  async function upload() {
    if (!file) return;
    try {
      setStatus("Uploading...");
      const asset = await uploadAdminImage(file, alt || file.name);
      setAssets((current) => [asset, ...current]);
      setFile(null);
      setAlt("");
      setStatus("Uploaded.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Upload failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Media Library</p>
        <h1 className="mt-3 text-4xl font-medium">Media Library</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Upload images once, then use them in members, gallery albums, pages, events, and announcements.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription className="text-white/45">JPG, PNG, WebP, or GIF. Maximum 5 MB.</CardDescription>
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
                  {src ? <SmartImage src={src} alt={asset.alt ?? "Media asset"} /> : null}
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
