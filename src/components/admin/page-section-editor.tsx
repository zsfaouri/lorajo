"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2, X, XCircle } from "lucide-react";

import { DriveImagePicker, type DriveMediaAsset } from "@/components/admin/drive-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, isRecord } from "@/lib/utils";

type MediaAsset = DriveMediaAsset;

type Section = {
  id: string;
  type: string;
  variant: string;
  sortOrder: number;
  isVisible: boolean;
  content: unknown;
  settings: unknown;
  spacing?: unknown;
  background?: unknown;
  alignment?: string | null;
};

type PageMeta = {
  id: string;
  locale: "EN" | "AR" | string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  driveFolderId?: string | null;
};

type EditableSection = Omit<Section, "content" | "settings" | "spacing" | "background"> & {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  spacing: Record<string, unknown>;
  background: Record<string, unknown>;
};

const sectionTypeOptions = [
  ["hero", "Hero"],
  ["video_scroll_hero", "Scroll video hero"],
  ["rich_text", "Text section"],
  ["image_text", "Text with image"],
  ["video", "Video"],
  ["gallery_grid", "Image grid"],
  ["gallery_masonry", "Photo gallery"],
  ["member_grid", "Members"],
  ["event_list", "Events"],
  ["announcement_list", "Announcements list"],
  ["cta", "Call to action"],
  ["contact_form", "Contact form"],
  ["newsletter_signup", "Newsletter signup"],
  ["neighborhood_archive", "Neighborhood archive"],
] as const;

const variantOptions: Record<string, Array<[string, string]>> = {
  hero: [
    ["editorial_fullscreen", "Full screen"],
    ["split_text_image", "Split text/image"],
    ["centered_minimal", "Centered minimal"],
    ["video_scroll_scale", "Scroll image sequence"],
  ],
  video_scroll_hero: [["video_scroll_scale", "Scroll video scale"]],
  rich_text: [
    ["editorial_body", "Editorial body"],
    ["what_we_do_gallery", "Image + text grid"],
  ],
  image_text: [
    ["image_left", "Image left"],
    ["image_right", "Image right"],
    ["overlapping_editorial", "Overlapping"],
    ["full_bleed_image", "Full bleed image"],
  ],
  video: [
    ["embedded", "Embedded video"],
    ["direct_file", "Direct video file"],
  ],
  gallery_grid: [
    ["lightbox_grid", "Lightbox grid"],
    ["masonry", "Masonry"],
    ["carousel", "Carousel"],
  ],
  gallery_masonry: [
    ["staggered_grid", "Staggered grid"],
    ["interactive_selector", "Interactive selector"],
    ["masonry", "Masonry"],
  ],
  member_grid: [
    ["team_showcase", "Team showcase"],
    ["editorial_portraits", "Editorial portraits"],
    ["clean_cards", "Clean cards"],
    ["compact_list", "Compact list"],
  ],
  announcement_list: [
    ["cards", "Cards"],
    ["list", "List"],
  ],
  neighborhood_archive: [["searchable_library", "Searchable library"]],
};

const backgroundOptions = [
  ["softWhite", "White background"],
  ["heritageGreenLight", "Light green background"],
  ["black", "Dark background"],
  ["", "No change"],
] as const;

const spacingOptions = [
  ["", "Normal spacing"],
  ["more", "More space above"],
  ["less", "Less space above"],
  ["none", "No spacing"],
] as const;

const spacingValueMap: Record<string, string> = {
  more: "9rem",
  less: "3rem",
  none: "0",
};

const spacingLabelByValue = new Map([
  ["", ""],
  ["7rem", ""],
  ["9rem", "more"],
  ["3rem", "less"],
  ["0", "none"],
]);

type NoticeType = "success" | "error" | "info";

function asEditableSection(section: Section): EditableSection {
  return {
    ...section,
    content: isRecord(section.content) ? section.content : {},
    settings: isRecord(section.settings) ? section.settings : {},
    spacing: isRecord(section.spacing) ? section.spacing : {},
    background: isRecord(section.background) ? section.background : {},
  };
}

function stringValue(record: Record<string, unknown>, key: string, fallback = "") {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function imageItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({
      src: typeof item.src === "string" ? item.src : "",
      alt: typeof item.alt === "string" ? item.alt : "",
      caption: typeof item.caption === "string" ? item.caption : "",
    }))
    .filter((item) => item.src);
}

function ctaValue(value: unknown) {
  if (!isRecord(value)) return { label: "", href: "" };
  return {
    label: typeof value.label === "string" ? value.label : "",
    href: typeof value.href === "string" ? value.href : "",
  };
}

function getSectionLabel(section: EditableSection) {
  if (section.type === "rich_text" && section.variant === "what_we_do_gallery") return "Public What We Do hero";
  if (typeof section.content.title === "string") return section.content.title;
  if (typeof section.content.subtitle === "string") return section.content.subtitle;
  return `${section.type} / ${section.variant}`;
}

function sectionVariantOptions(type: string) {
  return variantOptions[type] ?? [["default", "Default"]];
}

function defaultContentForType(type: string) {
  if (type === "video") return { title: "Video section", body: "", videoUrl: "", image: "" };
  if (type === "contact_form") return { title: "Contact LORA", body: "" };
  if (type === "newsletter_signup") return { title: "Newsletter", body: "", buttonLabel: "Subscribe" };
  if (type === "event_list") return { title: "Events", subtitle: "Upcoming gatherings, meetings, and neighborhood programs." };
  if (type === "announcement_list") return { title: "Announcements", subtitle: "Latest updates from LORA." };
  if (type === "neighborhood_archive") return { title: "Neighborhood Archive", subtitle: "Search names, photographs, videos, and memory fragments connected to Jabal Al-Luweibdeh." };
  if (type === "gallery_grid") return { title: "Image gallery", items: [] };
  if (type === "image_text") return { title: "New section", body: "", image: "" };
  if (type === "cta") return { title: "Call to action", body: "", cta: { label: "Open", href: "/" } };
  return { title: "New section", body: "" };
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PageSectionEditor({
  pageId,
  pageTitle,
  page,
  sections,
  mediaAssets,
}: {
  pageId: string;
  pageTitle: string;
  page?: PageMeta;
  sections: Section[];
  mediaAssets: MediaAsset[];
}) {
  const router = useRouter();
  const initialSections = useMemo(() => sections.map(asEditableSection), [sections]);
  const initialActiveId = initialSections.find((section) => section.isVisible)?.id ?? initialSections[0]?.id ?? "";
  const [sectionList, setSectionList] = useState(initialSections);
  const [activeId, setActiveId] = useState(initialActiveId);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [statusType, setStatusType] = useState<Record<string, NoticeType>>({});
  const [pageStatus, setPageStatus] = useState("");
  const [pageStatusType, setPageStatusType] = useState<NoticeType>("info");
  const [pageDraft, setPageDraft] = useState<PageMeta>(
    page ?? { id: pageId, locale: "EN", title: pageTitle, slug: "", status: "DRAFT", seoTitle: "", seoDescription: "", seoImage: "" },
  );
  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<string | null>(null);
  const [confirmDeletePage, setConfirmDeletePage] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [pendingSectionType, setPendingSectionType] = useState("rich_text");
  const folderId = pageDraft.driveFolderId ?? undefined;
  const activeSection = sectionList.find((section) => section.id === activeId) ?? sectionList[0];

  useEffect(() => {
    const successIds = Object.entries(statusType)
      .filter(([, type]) => type === "success")
      .map(([id]) => id);
    if (successIds.length === 0) return;
    const timeout = window.setTimeout(() => {
      setStatus((current) => {
        const next = { ...current };
        for (const id of successIds) delete next[id];
        return next;
      });
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [status, statusType]);

  useEffect(() => {
    if (pageStatusType !== "success" || !pageStatus) return;
    const timeout = window.setTimeout(() => setPageStatus(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [pageStatus, pageStatusType]);

  function setSectionStatus(sectionId: string, message: string, type: NoticeType = "info") {
    setStatus((current) => ({ ...current, [sectionId]: message }));
    setStatusType((current) => ({ ...current, [sectionId]: type }));
  }

  function setPageStatusMessage(message: string, type: NoticeType = "info") {
    setPageStatus(message);
    setPageStatusType(type);
  }

  function setActiveSection(sectionId: string) {
    if (sectionId === activeId) return;
    if (dirtySections[activeId] && !window.confirm("You have unsaved changes in this section. Discard them?")) return;
    setActiveId(sectionId);
    setPendingDeleteSectionId(null);
  }

  function updateSection(sectionId: string, updater: (section: EditableSection) => EditableSection) {
    setSectionList((current) => current.map((section) => (section.id === sectionId ? updater(section) : section)));
    setDirtySections((current) => ({ ...current, [sectionId]: true }));
  }

  async function save(section: EditableSection) {
    setSectionStatus(section.id, "Saving...");
    const response = await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: section.type,
        variant: section.variant,
        sortOrder: Number(section.sortOrder),
        isVisible: Boolean(section.isVisible),
        content: section.content,
        settings: section.settings,
        spacing: section.spacing,
        background: section.background,
        alignment: section.alignment || null,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setSectionStatus(section.id, json.error ?? "Save failed", "error");
      return;
    }
    setDirtySections((current) => ({ ...current, [section.id]: false }));
    setSectionStatus(section.id, "Saved", "success");
  }

  async function savePage() {
    setPageStatusMessage("Saving page...");
    const response = await fetch(`/api/admin/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: pageDraft.locale === "AR" ? "AR" : "EN",
        title: pageDraft.title.trim(),
        slug: makeSlug(pageDraft.slug || pageDraft.title),
        seoTitle: pageDraft.seoTitle || null,
        seoDescription: pageDraft.seoDescription || null,
        seoImage: pageDraft.seoImage || null,
        status: pageDraft.status === "PUBLISHED" || pageDraft.status === "ARCHIVED" ? pageDraft.status : "DRAFT",
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setPageStatusMessage(json.error ?? "Page save failed", "error");
      return;
    }
    setPageDraft((current) => ({ ...current, ...json }));
    setPageStatusMessage("Page saved", "success");
  }

  async function deletePage() {
    setPageStatusMessage("Deleting page...");
    const response = await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setPageStatusMessage(json.error ?? "Page delete failed", "error");
      return;
    }
    router.push("/admin/pages");
  }

  async function addSection(type = "rich_text") {
    if (dirtySections[activeId] && !window.confirm("You have unsaved changes in this section. Discard them?")) return;
    setSectionStatus("new", "Adding...");
    const nextSort = Math.max(0, ...sectionList.map((section) => section.sortOrder)) + 1;
    const response = await fetch(`/api/admin/pages/${pageId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        variant: sectionVariantOptions(type)[0][0],
        sortOrder: nextSort,
        isVisible: true,
        content: defaultContentForType(type),
        settings: {},
        spacing: {},
        background: {},
        alignment: null,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setSectionStatus("new", json.error ?? "Add failed", "error");
      return;
    }
    const section = asEditableSection(json);
    setSectionList((current) => [...current, section].sort((a, b) => a.sortOrder - b.sortOrder));
    setActiveId(section.id);
    setShowAddPanel(false);
    setSectionStatus("new", "Added", "success");
  }

  async function deleteSection(sectionId: string) {
    setSectionStatus(sectionId, "Deleting...");
    const response = await fetch(`/api/admin/sections/${sectionId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setSectionStatus(sectionId, json.error ?? "Delete failed", "error");
      return;
    }
    setSectionList((current) => current.filter((section) => section.id !== sectionId));
    setActiveId((current) => (current === sectionId ? sectionList.find((section) => section.id !== sectionId)?.id ?? "" : current));
    setPendingDeleteSectionId(null);
    setSectionStatus(sectionId, "Deleted", "success");
  }

  async function moveSection(sectionId: string, direction: -1 | 1) {
    const currentIndex = sectionList.findIndex((section) => section.id === sectionId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sectionList.length) return;
    const reordered = moveItem(sectionList, currentIndex, nextIndex).map((section, index) => ({ ...section, sortOrder: index + 1 }));
    setSectionList(reordered);
    setSectionStatus(sectionId, "Saving order...");
    const response = await fetch("/api/admin/sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionIds: reordered.map((section) => section.id) }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSectionStatus(sectionId, json.error ?? "Order save failed", "error");
      return;
    }
    setSectionStatus(sectionId, "Order saved", "success");
  }

  if (!activeSection) {
    return (
      <div className="grid gap-6">
        <h1 className="text-4xl font-medium">{pageTitle}</h1>
        <Button type="button" variant="admin" onClick={() => addSection()}>
          Add first section
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="grid content-start gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Page editor</p>
          <h1 className="mt-3 text-3xl font-medium text-black">{pageTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-black/58">Edit page settings. Add sections. Choose images from Drive. Add videos and forms.</p>
        </div>

        <Card className="border-black/10 bg-white text-black">
          <CardHeader>
            <CardTitle>Page settings</CardTitle>
            <CardDescription className="text-black/55">Title, URL, SEO, status, and deletion.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Page title">
              <Input value={pageDraft.title} onChange={(event) => setPageDraft((current) => ({ ...current, title: event.target.value }))} className="border-black/10 bg-white text-black" />
            </Field>
            <Field label="URL slug">
              <Input value={pageDraft.slug} onChange={(event) => setPageDraft((current) => ({ ...current, slug: makeSlug(event.target.value) }))} className="border-black/10 bg-white text-black" />
            </Field>
            <Field label="SEO title">
              <Input value={pageDraft.seoTitle ?? ""} onChange={(event) => setPageDraft((current) => ({ ...current, seoTitle: event.target.value }))} className="border-black/10 bg-white text-black" />
            </Field>
            <Field label="SEO description">
              <Textarea value={pageDraft.seoDescription ?? ""} onChange={(event) => setPageDraft((current) => ({ ...current, seoDescription: event.target.value }))} className="min-h-24 border-black/10 bg-white text-black" />
            </Field>
            <DriveImagePicker
              assets={mediaAssets}
              selectedUrls={pageDraft.seoImage ? [pageDraft.seoImage] : []}
              folderId={folderId}
              compact
              title="SEO social image"
              description="Used when this page is shared on Google, Facebook, WhatsApp, and social platforms."
              onPick={(asset) => setPageDraft((current) => ({ ...current, seoImage: asset.url }))}
            />
            <Field label="Status">
              <select
                value={pageDraft.status}
                onChange={(event) => setPageDraft((current) => ({ ...current, status: event.target.value }))}
                className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="green" size="sm" onClick={savePage}>
                Save page
              </Button>
              {confirmDeletePage ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={deletePage} className="border-red-500 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white">
                    Confirm delete
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeletePage(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeletePage(true)} className="border-red-500/45 text-red-700 hover:bg-red-600 hover:text-white">
                  Delete page
                </Button>
              )}
            </div>
            <Notice message={pageStatus} type={pageStatusType} />
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white text-black">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription className="text-black/55">{sectionList.length} sections</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {sectionList.map((section, index) => {
              const dirty = Boolean(dirtySections[section.id]);
              return (
                <div key={section.id} className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "rounded-md border p-3 text-left transition",
                      section.id === activeSection.id
                        ? "border-[var(--color-heritage-green)] bg-[var(--color-heritage-green)] text-white"
                        : "border-black/10 bg-white text-black/70 hover:border-[var(--color-heritage-green)]/35 hover:text-black",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {getSectionLabel(section)}
                      {dirty ? <span className="rounded-full bg-[var(--color-terracotta)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">Unsaved</span> : null}
                      {!section.isVisible ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-black/60">Hidden</span> : null}
                    </span>
                    <span className={cn("mt-1 block text-xs", section.id === activeSection.id ? "text-white/70" : "text-black/45")}>
                      {sectionTypeOptions.find(([value]) => value === section.type)?.[1] ?? section.type} / {sectionVariantOptions(section.type).find(([value]) => value === section.variant)?.[1] ?? section.variant}
                    </span>
                  </button>
                  <div className="grid gap-1">
                    <Button type="button" variant="outline" size="icon" disabled={index === 0} onClick={() => void moveSection(section.id, -1)} aria-label="Move section up">
                      <ChevronUp size={15} />
                    </Button>
                    <Button type="button" variant="outline" size="icon" disabled={index === sectionList.length - 1} onClick={() => void moveSection(section.id, 1)} aria-label="Move section down">
                      <ChevronDown size={15} />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="mt-3 grid gap-2">
              <Button type="button" variant="green" onClick={() => setShowAddPanel((current) => !current)} className="justify-center">
                <Plus size={16} />
                Add section
              </Button>
              {showAddPanel ? (
                <div className="grid gap-3 rounded-md border border-black/10 bg-[var(--color-soft-white)] p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sectionTypeOptions.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPendingSectionType(value)}
                        className={cn(
                          "rounded-md border p-3 text-left text-sm transition",
                          pendingSectionType === value ? "border-[var(--color-heritage-green)] bg-white text-black" : "border-black/10 bg-white/70 text-black/65 hover:text-black",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="green" size="sm" onClick={() => void addSection(pendingSectionType)}>
                      Add
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPanel(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              <Notice message={status.new} type={statusType.new} />
            </div>
          </CardContent>
        </Card>
      </aside>

      <SectionForm
        section={activeSection}
        assets={mediaAssets}
        folderId={folderId}
        status={status[activeSection.id]}
        statusType={statusType[activeSection.id]}
        isDirty={Boolean(dirtySections[activeSection.id])}
        onChange={(updater) => updateSection(activeSection.id, updater)}
        onSave={() => save(activeSection)}
        onDelete={() => deleteSection(activeSection.id)}
        isConfirmingDelete={pendingDeleteSectionId === activeSection.id}
        onRequestDelete={() => setPendingDeleteSectionId(activeSection.id)}
        onCancelDelete={() => setPendingDeleteSectionId(null)}
      />
    </div>
  );
}

function SectionForm({
  section,
  assets,
  folderId,
  status,
  statusType = "info",
  isDirty,
  onChange,
  onSave,
  onDelete,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
}: {
  section: EditableSection;
  assets: MediaAsset[];
  folderId?: string;
  status?: string;
  statusType?: NoticeType;
  isDirty?: boolean;
  onChange: (updater: (section: EditableSection) => EditableSection) => void;
  onSave: () => void;
  onDelete: () => void;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
}) {
  function setContent(key: string, value: unknown) {
    onChange((current) => ({ ...current, content: { ...current.content, [key]: value } }));
  }

  function setSettings(key: string, value: unknown) {
    onChange((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  function setType(type: string) {
    onChange((current) => ({ ...current, type, variant: sectionVariantOptions(type)[0][0] }));
  }

  const heroFrames = stringList(section.settings.heroScrubFrames);
  const contentItems = imageItems(section.content.items);
  const whatWeDoImages = imageItems(section.content.images);

  return (
    <Card className="border-black/10 bg-white text-black">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getSectionLabel(section)}
              {isDirty ? <span className="rounded-full bg-[var(--color-terracotta)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">Unsaved</span> : null}
            </CardTitle>
            <CardDescription className="mt-2 text-black/55">Simple controls for this section.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Notice message={status} type={statusType} />
            <Button type="button" variant="green" onClick={onSave}>
              Save changes
            </Button>
            {isConfirmingDelete ? (
              <>
                <Button type="button" variant="outline" onClick={onDelete} className="border-red-500 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white">
                  <Trash2 size={16} />
                  Confirm delete
                </Button>
                <Button type="button" variant="outline" onClick={onCancelDelete}>
                  <X size={16} />
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" onClick={onRequestDelete} className="border-red-500/45 text-red-700 hover:bg-red-600 hover:text-white">
                Delete section
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Section type">
            <select value={section.type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black">
              {sectionTypeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Design">
            <select
              value={section.variant}
              onChange={(event) => onChange((current) => ({ ...current, variant: event.target.value }))}
              className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
            >
              {sectionVariantOptions(section.type).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visibility">
            <select
              value={section.isVisible ? "true" : "false"}
              onChange={(event) => onChange((current) => ({ ...current, isVisible: event.target.value === "true" }))}
              className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
            >
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input value={stringValue(section.content, "title")} onChange={(event) => setContent("title", event.target.value)} className="border-black/10 bg-white text-black" />
          </Field>
          <Field label="Subtitle">
            <Input value={stringValue(section.content, "subtitle")} onChange={(event) => setContent("subtitle", event.target.value)} className="border-black/10 bg-white text-black" />
          </Field>
        </div>

        {section.type === "hero" || section.type === "video_scroll_hero" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tagline">
                <Input value={stringValue(section.content, "tagline")} onChange={(event) => setContent("tagline", event.target.value)} className="border-black/10 bg-white text-black" />
              </Field>
              <Field label="Button text">
                <Input
                  value={ctaValue(section.content.cta).label}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), label: event.target.value })}
                  className="border-black/10 bg-white text-black"
                />
              </Field>
            </div>
            <Field label="Short text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-black/10 bg-white text-black" />
            </Field>
            <ImageListEditor
              title="Hero images"
              description="Choose images from Google Drive. The first image is also used as the fallback image."
              images={heroFrames}
              assets={assets}
              folderId={folderId}
              onChange={(paths) => {
                setSettings("heroScrubFrames", paths);
                setContent("image", paths[0] ?? "");
              }}
            />
          </>
        ) : null}

        {section.type === "image_text" ? (
          <>
            <Field label="Text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-36 border-black/10 bg-white text-black" />
            </Field>
            <ImageListEditor
              title="Section image"
              description="Choose one image for this section."
              images={stringValue(section.content, "image") ? [stringValue(section.content, "image")] : []}
              assets={assets}
              folderId={folderId}
              maxImages={1}
              onChange={(paths) => setContent("image", paths[0] ?? "")}
            />
          </>
        ) : null}

        {section.type === "video" ? (
          <>
            <Field label="Video URL">
              <Input
                value={stringValue(section.content, "videoUrl")}
                onChange={(event) => setContent("videoUrl", event.target.value)}
                placeholder="YouTube, Vimeo, Google Drive, or direct MP4 URL"
                className="border-black/10 bg-white text-black"
              />
            </Field>
            <Field label="Video text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-black/10 bg-white text-black" />
            </Field>
            <ImageListEditor
              title="Poster image"
              description="Choose a Drive image to use as the poster or fallback visual."
              images={stringValue(section.content, "image") ? [stringValue(section.content, "image")] : []}
              assets={assets}
              folderId={folderId}
              maxImages={1}
              onChange={(paths) => setContent("image", paths[0] ?? "")}
            />
          </>
        ) : null}

        {section.type === "cta" ? (
          <>
            <Field label="Text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-black/10 bg-white text-black" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Button label">
                <Input
                  value={ctaValue(section.content.cta).label}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), label: event.target.value })}
                  className="border-black/10 bg-white text-black"
                />
              </Field>
              <Field label="Button link">
                <Input
                  value={ctaValue(section.content.cta).href}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), href: event.target.value })}
                  className="border-black/10 bg-white text-black"
                />
              </Field>
            </div>
          </>
        ) : null}

        {section.type === "rich_text" ? (
          <>
            <Field label="Body text">
              <Textarea
                value={Array.isArray(section.content.body) ? stringList(section.content.body).join("\n\n") : stringValue(section.content, "body")}
                onChange={(event) =>
                  setContent(
                    "body",
                    section.variant === "what_we_do_gallery"
                      ? event.target.value.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean)
                      : event.target.value,
                  )
                }
                className="min-h-48 border-black/10 bg-white text-black"
              />
            </Field>
            {section.variant === "what_we_do_gallery" ? (
              <ImageObjectListEditor
                title="Public What We Do hero images"
                images={whatWeDoImages}
                assets={assets}
                folderId={folderId}
                onChange={(images) => setContent("images", images)}
              />
            ) : null}
          </>
        ) : null}

        {section.type === "gallery_grid" ? (
          <ImageObjectListEditor
            title="Gallery images"
            images={contentItems}
            assets={assets}
            folderId={folderId}
            onChange={(images) => setContent("items", images)}
          />
        ) : null}

        {section.type === "gallery_masonry" ? (
          <div className="rounded-md border border-black/10 bg-[var(--color-soft-white)] p-4">
            <p className="text-sm font-medium">Photo gallery source</p>
            <p className="mt-2 text-sm leading-6 text-black/58">
              This page pulls images from Gallery Manager collections. Use Gallery Manager to add, remove, or reorder photo
              groups. The page design is controlled here.
            </p>
            <Link className="mt-4 inline-flex text-sm text-[var(--color-heritage-green)] underline underline-offset-4" href="/admin/gallery">
              Open Gallery Manager
            </Link>
          </div>
        ) : null}

        {section.type === "member_grid" ? (
          <div className="rounded-md border border-black/10 bg-[var(--color-soft-white)] p-4">
            <p className="text-sm font-medium">Founding members source</p>
            <p className="mt-2 text-sm leading-6 text-black/58">Member cards come from Founding Members Manager. Text and design stay editable here.</p>
            <Link className="mt-4 inline-flex text-sm text-[var(--color-heritage-green)] underline underline-offset-4" href="/admin/members">
              Open Members Manager
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-black/10 pt-6 md:grid-cols-3">
          <Field label="Top spacing">
            <select
              value={spacingLabelByValue.get(stringValue(section.spacing, "top")) ?? ""}
              onChange={(event) => onChange((current) => ({ ...current, spacing: { ...current.spacing, top: spacingValueMap[event.target.value] ?? "" } }))}
              className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
            >
              {spacingOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bottom spacing">
            <select
              value={spacingLabelByValue.get(stringValue(section.spacing, "bottom")) ?? ""}
              onChange={(event) => onChange((current) => ({ ...current, spacing: { ...current.spacing, bottom: spacingValueMap[event.target.value] ?? "" } }))}
              className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
            >
              {spacingOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Background">
            <select
              value={stringValue(section.background, "token")}
              onChange={(event) => onChange((current) => ({ ...current, background: { ...current.background, token: event.target.value } }))}
              className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-black"
            >
              {backgroundOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-black/60">{label}</Label>
      {children}
    </div>
  );
}

function Notice({ message, type = "info" }: { message?: string; type?: NoticeType }) {
  if (!message) return null;
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", type === "error" ? "text-red-700" : type === "success" ? "text-[var(--color-heritage-green)]" : "text-black/60")}>
      {type === "error" ? <XCircle size={16} /> : type === "success" ? <CheckCircle2 size={16} /> : null}
      {message}
    </span>
  );
}

function ImageListEditor({
  title,
  description,
  images,
  assets,
  folderId,
  maxImages,
  onChange,
}: {
  title: string;
  description: string;
  images: string[];
  assets: MediaAsset[];
  folderId?: string;
  maxImages?: number;
  onChange: (paths: string[]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-black/55">{description}</p>
      </div>
      <SelectedImages images={images} onChange={onChange} />
      <MediaPicker assets={assets} folderId={folderId} selected={images} maxImages={maxImages} onChange={onChange} />
    </div>
  );
}

function ImageObjectListEditor({
  title,
  images,
  assets,
  folderId,
  onChange,
}: {
  title: string;
  images: Array<{ src: string; alt: string; caption: string }>;
  assets: MediaAsset[];
  folderId?: string;
  onChange: (images: Array<{ src: string; alt: string; caption: string }>) => void;
}) {
  const paths = images.map((image) => image.src);
  return (
    <ImageListEditor
      title={title}
      description="Pick images visually. Captions can be edited after selecting."
      images={paths}
      assets={assets}
      folderId={folderId}
      onChange={(nextPaths) => {
        const nextImages = nextPaths.map((src) => {
          const existing = images.find((image) => image.src === src);
          const asset = assets.find((item) => item.url === src);
          return existing ?? { src, alt: asset?.alt ?? "", caption: asset?.caption ?? asset?.alt ?? "" };
        });
        onChange(nextImages);
      }}
    />
  );
}

function SelectedImages({ images, onChange }: { images: string[]; onChange: (paths: string[]) => void }) {
  if (!images.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {images.map((src, index) => (
        <figure key={`${src}-${index}`} className="overflow-hidden rounded-md border border-black/10 bg-black/[0.04]">
          <div className="relative aspect-[4/3]">
            <Image src={src} alt="" fill className="object-cover" sizes="220px" unoptimized={src.startsWith("http")} />
          </div>
          <figcaption className="grid gap-2 p-3">
            <span className="truncate text-xs text-black/45">Selected image {index + 1}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}>
                Remove
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => onChange(moveItem(images, index, index - 1))}>
                Up
              </Button>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function MediaPicker({
  assets,
  folderId,
  selected,
  maxImages,
  onChange,
}: {
  assets: MediaAsset[];
  folderId?: string;
  selected: string[];
  maxImages?: number;
  onChange: (paths: string[]) => void;
}) {
  return (
    <DriveImagePicker
      assets={assets}
      selectedUrls={selected}
      folderId={folderId}
      title="Choose from Google Drive"
      description="All images come from the Drive folders synced in Image Cloud."
      onPick={(asset) => {
        if (selected.includes(asset.url)) {
          onChange(selected.filter((item) => item !== asset.url));
          return;
        }
        const next = [...selected, asset.url];
        onChange(typeof maxImages === "number" ? next.slice(-maxImages) : next);
      }}
    />
  );
}

function moveItem<T>(items: T[], from: number, to: number) {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
