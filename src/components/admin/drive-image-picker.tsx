"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DriveMediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  source?: string | null;
  metadata?: unknown;
};

function metadataValue(asset: DriveMediaAsset, key: string) {
  const metadata = asset.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalCategory(value: string) {
  const slug = slugify(value);
  if (["famous", "famous-figures", "famous-figuers"].includes(slug)) return "famous-figures";
  if (["founders", "founding-members"].includes(slug)) return "founding-members";
  if (["hero", "hero-pics", "hero-pictures"].includes(slug)) return "hero-pics";
  if (["historical-pics", "historical-photos", "history"].includes(slug)) return "historical-photos";
  return slug;
}

export function driveAssetCategorySlug(asset: DriveMediaAsset) {
  return canonicalCategory(metadataValue(asset, "driveFolderName") || metadataValue(asset, "category"));
}

export function driveAssetCategoryLabel(asset: DriveMediaAsset) {
  return metadataValue(asset, "driveFolderName") || metadataValue(asset, "category") || "Google Drive";
}

export function isDriveAsset(asset: DriveMediaAsset) {
  return asset.source?.toLowerCase() === "google drive" || Boolean(metadataValue(asset, "driveFolderId"));
}

async function syncGoogleDrive() {
  const response = await fetch("/api/admin/gallery/sync-drive", { method: "POST", cache: "no-store" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Drive sync failed.");
  return json as { folders?: number; images?: number };
}

export function DriveImagePicker({
  assets,
  selectedIds = [],
  selectedUrls = [],
  onPick,
  title = "Choose from Google Drive",
  description = "Upload files in Google Drive, then sync here.",
  category,
  lockCategory = false,
  emptyMessage,
  compact = false,
}: {
  assets: DriveMediaAsset[];
  selectedIds?: string[];
  selectedUrls?: string[];
  onPick: (asset: DriveMediaAsset) => void;
  title?: string;
  description?: string;
  category?: string | string[];
  lockCategory?: boolean;
  emptyMessage?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(() => {
    if (Array.isArray(category)) return category[0] ?? "all";
    return category ?? "all";
  });
  const [status, setStatus] = useState("");

  const driveAssets = useMemo(() => assets.filter(isDriveAsset), [assets]);
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const asset of driveAssets) {
      const slug = driveAssetCategorySlug(asset);
      if (!slug) continue;
      map.set(slug, driveAssetCategoryLabel(asset));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [driveAssets]);

  const allowedCategories = useMemo(() => {
    if (!category) return null;
    return new Set((Array.isArray(category) ? category : [category]).map(canonicalCategory));
  }, [category]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedActive = canonicalCategory(activeCategory);
    return driveAssets.filter((asset) => {
      const assetCategory = driveAssetCategorySlug(asset);
      if (allowedCategories && !allowedCategories.has(assetCategory)) return false;
      if (!lockCategory && normalizedActive !== "all" && assetCategory !== normalizedActive) return false;
      if (!normalizedQuery) return true;
      return `${asset.alt ?? ""} ${asset.caption ?? ""} ${driveAssetCategoryLabel(asset)}`.toLowerCase().includes(normalizedQuery);
    });
  }, [activeCategory, allowedCategories, driveAssets, lockCategory, query]);

  async function handleSync() {
    setStatus("Reading Google Drive...");
    try {
      const result = await syncGoogleDrive();
      setStatus(`Synced ${result.folders ?? 0} folders / ${result.images ?? 0} images. Reloading...`);
      window.location.reload();
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Drive sync failed.");
    }
  }

  return (
    <div className={cn("grid gap-3 rounded-md border border-black/10 bg-white p-3 text-black shadow-sm", compact ? "p-3" : "p-4")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm text-black/55">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleSync} className="shrink-0">
          <RefreshCw size={14} />
          Sync Drive
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_180px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Drive pictures" />
        {!lockCategory ? (
          <select
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="h-11 rounded-md border border-black/15 bg-white px-3 text-sm text-black outline-none"
          >
            <option value="all">All folders</option>
            {categoryOptions.map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {filteredAssets.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/15 bg-black/[0.02] p-5 text-sm leading-6 text-black/55">
          {emptyMessage ?? "No Drive pictures found for this category. Add pictures to the matching Google Drive folder, then click Sync Drive."}
        </div>
      ) : (
        <div className="grid max-h-[420px] gap-3 overflow-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id) || selectedUrls.includes(asset.url);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPick(asset)}
                className={cn(
                  "overflow-hidden rounded-md border bg-white text-left transition hover:border-[var(--color-heritage-green)]",
                  isSelected ? "border-[var(--color-heritage-green)] ring-2 ring-[var(--color-heritage-green)]/20" : "border-black/10",
                )}
                title={asset.caption ?? asset.alt ?? "Google Drive image"}
              >
                <div className="relative aspect-square bg-black/5">
                  <Image src={asset.url} alt={asset.alt ?? "Google Drive image"} fill className="object-cover" sizes="160px" unoptimized />
                </div>
                <span className="block truncate px-2 pt-2 text-xs font-medium text-black/70">{asset.caption ?? asset.alt ?? "Image"}</span>
                <span className="block truncate px-2 pb-2 pt-0.5 text-[11px] text-black/42">{driveAssetCategoryLabel(asset)}</span>
              </button>
            );
          })}
        </div>
      )}
      {status ? <p className="text-sm text-black/55">{status}</p> : null}
    </div>
  );
}
