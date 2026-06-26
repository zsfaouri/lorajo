"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";

import { DriveImagePicker, type DriveMediaAsset } from "@/components/admin/drive-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MediaAsset = DriveMediaAsset & { src?: string };

type Member = {
  id: string;
  locale: "EN" | "AR" | string;
  name: string;
  slug: string;
  title?: string | null;
  bio?: unknown;
  sortOrder: number;
  isFounder: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  mediaAssetId?: string | null;
  mediaAsset?: MediaAsset | null;
};

type DraftMember = {
  locale: "EN" | "AR";
  name: string;
  slug: string;
  title: string;
  bio: string;
  sortOrder: number;
  isFounder: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  mediaAssetId: string;
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bioToText(value: unknown, locale: "EN" | "AR" | string) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const localeKey = locale === "AR" ? "ar" : "en";
  const localized = record[localeKey];
  if (typeof localized === "string") return localized;
  const english = record.en;
  if (typeof english === "string") return english;
  const text = record.text;
  return typeof text === "string" ? text : "";
}

function memberToDraft(member: Member): DraftMember {
  return {
    locale: member.locale === "AR" ? "AR" : "EN",
    name: member.name,
    slug: member.slug,
    title: member.title ?? "",
    bio: bioToText(member.bio, member.locale),
    sortOrder: member.sortOrder ?? 0,
    isFounder: Boolean(member.isFounder),
    status: member.status === "DRAFT" || member.status === "ARCHIVED" ? member.status : "PUBLISHED",
    mediaAssetId: member.mediaAssetId ?? member.mediaAsset?.id ?? "",
  };
}

function emptyDraft(sortOrder: number): DraftMember {
  return {
    locale: "EN",
    name: "",
    slug: "",
    title: "Founding member",
    bio: "",
    sortOrder,
    isFounder: true,
    status: "PUBLISHED",
    mediaAssetId: "",
  };
}

function payloadFromDraft(draft: DraftMember) {
  return {
    locale: draft.locale,
    name: draft.name.trim(),
    slug: draft.slug.trim() || makeSlug(draft.name),
    title: draft.title.trim() || null,
    bio: draft.bio.trim() || null,
    sortOrder: Number(draft.sortOrder) || 0,
    isFounder: draft.isFounder,
    status: draft.status,
    mediaAssetId: draft.mediaAssetId || null,
  };
}

function assetUrl(asset?: MediaAsset | null) {
  return asset?.url ?? asset?.src ?? "";
}

function SmartImage({
  src,
  alt,
  fill,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
}) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn(fill ? "absolute inset-0 h-full w-full" : "", className)} />;
  }

  return <Image src={src} alt={alt} fill={fill} className={className} sizes={sizes} unoptimized={src.startsWith("http")} />;
}

export function MemberManager({
  initialMembers,
  mediaAssets,
  folderId,
}: {
  initialMembers: Member[];
  mediaAssets: MediaAsset[];
  folderId?: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [selectedId, setSelectedId] = useState(initialMembers[0]?.id ?? "new");
  const [drafts, setDrafts] = useState<Record<string, DraftMember>>(() =>
    Object.fromEntries(initialMembers.map((member) => [member.id, memberToDraft(member)])),
  );
  const [newDraft, setNewDraft] = useState<DraftMember>(() => emptyDraft(initialMembers.length + 1));
  const [status, setStatus] = useState("");

  const selected = members.find((member) => member.id === selectedId) ?? null;
  const activeDraft = selected ? drafts[selected.id] ?? memberToDraft(selected) : newDraft;
  const selectedAsset = mediaAssets.find((asset) => asset.id === activeDraft.mediaAssetId) ?? selected?.mediaAsset ?? null;

  function setActiveDraft(next: Partial<DraftMember>) {
    if (selected) {
      setDrafts((current) => {
        const existing = current[selected.id] ?? memberToDraft(selected);
        const merged = { ...existing, ...next };
        if (next.name && !existing.slug) merged.slug = makeSlug(next.name);
        return { ...current, [selected.id]: merged };
      });
      return;
    }

    setNewDraft((current) => {
      const merged = { ...current, ...next };
      if (next.name && !current.slug) merged.slug = makeSlug(next.name);
      return merged;
    });
  }

  function updateMemberState(member: Member) {
    setMembers((current) => current.map((item) => (item.id === member.id ? member : item)));
    setDrafts((current) => ({ ...current, [member.id]: memberToDraft(member) }));
  }

  async function saveMember() {
    const payload = payloadFromDraft(activeDraft);
    if (!payload.name) {
      setStatus("Name is required.");
      return;
    }

    setStatus(selected ? "Saving member..." : "Creating member...");
    const response = await fetch(selected ? `/api/admin/members/${selected.id}` : "/api/admin/members", {
      method: selected ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Save failed");
      return;
    }

    if (selected) {
      updateMemberState(json);
    } else {
      setMembers((current) => [json, ...current]);
      setDrafts((current) => ({ ...current, [json.id]: memberToDraft(json) }));
      setSelectedId(json.id);
      setNewDraft(emptyDraft(members.length + 2));
    }
    setStatus("Saved.");
  }

  async function deleteMember() {
    if (!selected) return;
    setStatus("Deleting member...");
    const response = await fetch(`/api/admin/members/${selected.id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Delete failed");
      return;
    }

    setMembers((current) => current.filter((member) => member.id !== selected.id));
    setDrafts((current) => {
      const next = { ...current };
      delete next[selected.id];
      return next;
    });
    setSelectedId("new");
    setStatus("Deleted.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="grid content-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">People</p>
          <h1 className="mt-3 text-3xl font-medium">Founding Members</h1>
          <p className="mt-3 text-sm leading-6 text-white/48">Click a member, change the text, choose a Drive photo, press Save.</p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedId("new")}
          className={cn(
            "flex items-center gap-3 rounded-md border p-4 text-left transition",
            selectedId === "new" ? "border-white/35 bg-white/12" : "border-white/10 bg-white/[0.04] hover:border-white/25",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
            <Plus size={18} />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Add new member</span>
            <span className="mt-1 block text-xs text-white/42">Name, role, photo, publish</span>
          </span>
        </button>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription className="text-white/45">{members.length} records</CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-[70vh] gap-2 overflow-auto">
            {members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedId(member.id)}
                className={cn(
                  "grid grid-cols-[48px_1fr] gap-3 rounded-md border p-2 text-left transition",
                  selectedId === member.id
                    ? "border-white/35 bg-white/12"
                    : "border-white/10 bg-black/22 hover:border-white/25 hover:bg-white/8",
                )}
              >
                <span className="relative h-12 w-12 overflow-hidden rounded-md bg-white/8">
                  {assetUrl(member.mediaAsset) ? (
                    <SmartImage src={assetUrl(member.mediaAsset)} alt={member.mediaAsset?.alt ?? member.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-white/40">No img</span>
                  )}
                </span>
                <span className="min-w-0 py-1">
                  <span className="block truncate text-sm font-medium text-white">{member.name}</span>
                  <span className="mt-1 block truncate text-xs text-white/42">
                    {member.locale} / {member.status}
                  </span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-6">
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>{selected ? `Edit ${selected.name}` : "Create member"}</CardTitle>
            <CardDescription className="text-white/45">All fields are normal form controls.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <section className="grid content-start gap-4">
              <div className="group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/35">
                {assetUrl(selectedAsset) ? (
                  <SmartImage src={assetUrl(selectedAsset)} alt={selectedAsset?.alt ?? activeDraft.name} fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="grid justify-items-center gap-3 text-center text-white/45">
                    <ImagePlus size={34} />
                    <p className="max-w-48 text-sm leading-5">Choose a portrait from the Drive founders folder.</p>
                  </div>
                )}
              </div>

              <DriveImagePicker
                assets={mediaAssets}
                selectedIds={activeDraft.mediaAssetId ? [activeDraft.mediaAssetId] : []}
                folderId={folderId}
                compact
                title="Choose from Drive founders folder"
                description="Only pictures inside the Google Drive founders folder appear here."
                emptyMessage="The Drive founders folder has no synced pictures. Add portraits to Google Drive, then click Sync Drive."
                onPick={(asset) => setActiveDraft({ mediaAssetId: asset.id })}
              />
            </section>

            <section className="grid content-start gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Name</Label>
                  <Input value={activeDraft.name} onChange={(event) => setActiveDraft({ name: event.target.value })} className="border-white/15 bg-white/8 text-white" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Role / title</Label>
                  <Input value={activeDraft.title} onChange={(event) => setActiveDraft({ title: event.target.value })} className="border-white/15 bg-white/8 text-white" />
                </div>
                <div className="grid gap-1.5 md:col-span-2">
                  <Label className="text-white/55">Flip card text</Label>
                  <textarea
                    value={activeDraft.bio}
                    onChange={(event) => setActiveDraft({ bio: event.target.value })}
                    className="min-h-28 rounded-md border border-white/15 bg-white/8 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-white/35"
                    placeholder="This text appears on the off-white back side when visitors click the founder photo."
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Public URL slug</Label>
                  <Input value={activeDraft.slug} onChange={(event) => setActiveDraft({ slug: makeSlug(event.target.value) })} className="border-white/15 bg-white/8 text-white" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Display order</Label>
                  <Input
                    type="number"
                    value={activeDraft.sortOrder}
                    onChange={(event) => setActiveDraft({ sortOrder: Number(event.target.value) })}
                    className="border-white/15 bg-white/8 text-white"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Language</Label>
                  <select
                    value={activeDraft.locale}
                    onChange={(event) => setActiveDraft({ locale: event.target.value === "AR" ? "AR" : "EN" })}
                    className="h-11 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white outline-none"
                  >
                    <option value="EN">English</option>
                    <option value="AR">Arabic</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-white/55">Status</Label>
                  <select
                    value={activeDraft.status}
                    onChange={(event) =>
                      setActiveDraft({ status: event.target.value === "DRAFT" || event.target.value === "ARCHIVED" ? event.target.value : "PUBLISHED" })
                    }
                    className="h-11 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white outline-none"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={activeDraft.isFounder}
                  onChange={(event) => setActiveDraft({ isFounder: event.target.checked })}
                  className="h-4 w-4 accent-white"
                />
                Show this person in the Founding Members section
              </label>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                <Button type="button" variant="admin" onClick={saveMember}>
                  <Save size={15} />
                  Save member
                </Button>
                {selected ? (
                  <Button type="button" variant="outline" onClick={deleteMember} className="border-red-400/50 text-red-200 hover:bg-red-500 hover:text-white">
                    <Trash2 size={15} />
                    Delete
                  </Button>
                ) : null}
                <span className="text-sm text-white/45">{status}</span>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
