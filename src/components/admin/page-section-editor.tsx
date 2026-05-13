"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

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
};

type EditableSection = Omit<Section, "content" | "settings" | "spacing" | "background"> & {
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  spacing: Record<string, unknown>;
  background: Record<string, unknown>;
};

const sectionTypeOptions = [
  ["hero", "Hero"],
  ["video_scroll_hero", "Video scroll hero"],
  ["rich_text", "Text section"],
  ["image_text", "Image + text"],
  ["video", "Video"],
  ["gallery_grid", "Image gallery"],
  ["gallery_masonry", "Photo gallery page"],
  ["member_grid", "Members"],
  ["event_list", "Events"],
  ["announcement_list", "Announcements"],
  ["cta", "Call to action"],
  ["contact_form", "Contact form"],
  ["newsletter_signup", "Newsletter signup"],
] as const;

const variantOptions: Record<string, Array<[string, string]>> = {
  hero: [
    ["editorial_fullscreen", "Editorial fullscreen"],
    ["split_text_image", "Split text/image"],
    ["centered_minimal", "Centered minimal"],
    ["video_scroll_scale", "Scroll image sequence"],
  ],
  video_scroll_hero: [["video_scroll_scale", "Scroll video scale"]],
  rich_text: [
    ["editorial_body", "Editorial body"],
    ["what_we_do_gallery", "What we do image grid"],
  ],
  image_text: [
    ["image_left", "Image left"],
    ["image_right", "Image right"],
    ["overlapping_editorial", "Overlapping editorial"],
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
};

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
  const [sectionList, setSectionList] = useState(initialSections);
  const [activeId, setActiveId] = useState(initialSections[0]?.id ?? "");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [pageStatus, setPageStatus] = useState("");
  const [pageDraft, setPageDraft] = useState<PageMeta>(
    page ?? { id: pageId, locale: "EN", title: pageTitle, slug: "", status: "DRAFT", seoTitle: "", seoDescription: "" },
  );
  const activeSection = sectionList.find((section) => section.id === activeId) ?? sectionList[0];

  function updateSection(sectionId: string, updater: (section: EditableSection) => EditableSection) {
    setSectionList((current) => current.map((section) => (section.id === sectionId ? updater(section) : section)));
  }

  async function save(section: EditableSection) {
    setStatus((current) => ({ ...current, [section.id]: "Saving..." }));
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
    setStatus((current) => ({ ...current, [section.id]: response.ok ? "Saved" : json.error ?? "Save failed" }));
  }

  async function savePage() {
    setPageStatus("Saving page...");
    const response = await fetch(`/api/admin/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: pageDraft.locale === "AR" ? "AR" : "EN",
        title: pageDraft.title.trim(),
        slug: makeSlug(pageDraft.slug || pageDraft.title),
        seoTitle: pageDraft.seoTitle || null,
        seoDescription: pageDraft.seoDescription || null,
        status: pageDraft.status === "PUBLISHED" || pageDraft.status === "ARCHIVED" ? pageDraft.status : "DRAFT",
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setPageStatus(json.error ?? "Page save failed");
      return;
    }
    setPageDraft((current) => ({ ...current, ...json }));
    setPageStatus("Page saved");
  }

  async function deletePage() {
    if (!window.confirm("Delete this page and all of its sections?")) return;
    setPageStatus("Deleting page...");
    const response = await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setPageStatus(json.error ?? "Page delete failed");
      return;
    }
    router.push("/admin/pages");
  }

  async function addSection(type = "rich_text") {
    setStatus((current) => ({ ...current, new: "Adding..." }));
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
      setStatus((current) => ({ ...current, new: json.error ?? "Add failed" }));
      return;
    }
    const section = asEditableSection(json);
    setSectionList((current) => [...current, section].sort((a, b) => a.sortOrder - b.sortOrder));
    setActiveId(section.id);
    setStatus((current) => ({ ...current, new: "Added" }));
  }

  async function deleteSection(sectionId: string) {
    setStatus((current) => ({ ...current, [sectionId]: "Deleting..." }));
    const response = await fetch(`/api/admin/sections/${sectionId}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setStatus((current) => ({ ...current, [sectionId]: json.error ?? "Delete failed" }));
      return;
    }
    setSectionList((current) => current.filter((section) => section.id !== sectionId));
    setActiveId((current) => (current === sectionId ? sectionList.find((section) => section.id !== sectionId)?.id ?? "" : current));
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
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Page editor</p>
          <h1 className="mt-3 text-3xl font-medium">{pageTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-white/48">Edit page settings. Add sections. Choose images from Drive. Add videos and forms.</p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Page settings</CardTitle>
            <CardDescription className="text-white/45">Title, URL, SEO, status, and deletion.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Field label="Page title">
              <Input value={pageDraft.title} onChange={(event) => setPageDraft((current) => ({ ...current, title: event.target.value }))} className="border-white/15 bg-white/8 text-white" />
            </Field>
            <Field label="URL slug">
              <Input value={pageDraft.slug} onChange={(event) => setPageDraft((current) => ({ ...current, slug: makeSlug(event.target.value) }))} className="border-white/15 bg-white/8 text-white" />
            </Field>
            <Field label="SEO title">
              <Input value={pageDraft.seoTitle ?? ""} onChange={(event) => setPageDraft((current) => ({ ...current, seoTitle: event.target.value }))} className="border-white/15 bg-white/8 text-white" />
            </Field>
            <Field label="SEO description">
              <Textarea value={pageDraft.seoDescription ?? ""} onChange={(event) => setPageDraft((current) => ({ ...current, seoDescription: event.target.value }))} className="min-h-24 border-white/15 bg-white/8 text-white" />
            </Field>
            <Field label="Status">
              <select
                value={pageDraft.status}
                onChange={(event) => setPageDraft((current) => ({ ...current, status: event.target.value }))}
                className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="admin" size="sm" onClick={savePage}>
                Save page
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deletePage} className="border-red-400/50 text-red-200 hover:bg-red-500 hover:text-white">
                Delete page
              </Button>
            </div>
            <span className="text-sm text-white/45">{pageStatus}</span>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription className="text-white/45">{sectionList.length} sections</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {sectionList.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  section.id === activeSection.id
                    ? "border-white/35 bg-white/12 text-white"
                    : "border-white/10 bg-black/20 text-white/62 hover:border-white/24 hover:text-white",
                )}
              >
                <span className="block text-sm font-medium">{getSectionLabel(section)}</span>
                <span className="mt-1 block text-xs text-white/38">
                  {section.sortOrder}. {section.type} / {section.variant}
                </span>
              </button>
            ))}
            <div className="mt-3 grid gap-2">
              <select
                className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
                onChange={(event) => {
                  void addSection(event.target.value);
                  event.currentTarget.value = "";
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Add section
                </option>
                {sectionTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-white/45">{status.new}</span>
            </div>
          </CardContent>
        </Card>
      </aside>

      <SectionForm
        section={activeSection}
        assets={mediaAssets}
        status={status[activeSection.id]}
        onChange={(updater) => updateSection(activeSection.id, updater)}
        onSave={() => save(activeSection)}
        onDelete={() => deleteSection(activeSection.id)}
      />
    </div>
  );
}

function SectionForm({
  section,
  assets,
  status,
  onChange,
  onSave,
  onDelete,
}: {
  section: EditableSection;
  assets: MediaAsset[];
  status?: string;
  onChange: (updater: (section: EditableSection) => EditableSection) => void;
  onSave: () => void;
  onDelete: () => void;
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
    <Card className="border-white/10 bg-white/[0.04] text-white">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{getSectionLabel(section)}</CardTitle>
            <CardDescription className="mt-2 text-white/45">Simple controls for this section.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/45">{status}</span>
            <Button type="button" variant="admin" onClick={onSave}>
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={onDelete} className="border-red-400/50 text-red-200 hover:bg-red-500 hover:text-white">
              Delete section
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Section type">
            <select value={section.type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white">
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
              className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
            >
              {sectionVariantOptions(section.type).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Order">
            <Input
              type="number"
              value={section.sortOrder}
              onChange={(event) => onChange((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </Field>
          <Field label="Visibility">
            <select
              value={section.isVisible ? "true" : "false"}
              onChange={(event) => onChange((current) => ({ ...current, isVisible: event.target.value === "true" }))}
              className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white"
            >
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input value={stringValue(section.content, "title")} onChange={(event) => setContent("title", event.target.value)} className="border-white/15 bg-white/8 text-white" />
          </Field>
          <Field label="Subtitle">
            <Input value={stringValue(section.content, "subtitle")} onChange={(event) => setContent("subtitle", event.target.value)} className="border-white/15 bg-white/8 text-white" />
          </Field>
        </div>

        {section.type === "hero" || section.type === "video_scroll_hero" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tagline">
                <Input value={stringValue(section.content, "tagline")} onChange={(event) => setContent("tagline", event.target.value)} className="border-white/15 bg-white/8 text-white" />
              </Field>
              <Field label="Button text">
                <Input
                  value={ctaValue(section.content.cta).label}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), label: event.target.value })}
                  className="border-white/15 bg-white/8 text-white"
                />
              </Field>
            </div>
            <Field label="Short text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-white/15 bg-white/8 text-white" />
            </Field>
            <ImageListEditor
              title="Hero images"
              description="Choose images from Google Drive. The first image is also used as the fallback image."
              images={heroFrames}
              assets={assets}
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
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-36 border-white/15 bg-white/8 text-white" />
            </Field>
            <ImageListEditor
              title="Section image"
              description="Choose one image for this section."
              images={stringValue(section.content, "image") ? [stringValue(section.content, "image")] : []}
              assets={assets}
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
                className="border-white/15 bg-white/8 text-white"
              />
            </Field>
            <Field label="Video text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-white/15 bg-white/8 text-white" />
            </Field>
            <ImageListEditor
              title="Poster image"
              description="Choose a Drive image to use as the poster or fallback visual."
              images={stringValue(section.content, "image") ? [stringValue(section.content, "image")] : []}
              assets={assets}
              maxImages={1}
              onChange={(paths) => setContent("image", paths[0] ?? "")}
            />
          </>
        ) : null}

        {section.type === "cta" ? (
          <>
            <Field label="Text">
              <Textarea value={stringValue(section.content, "body")} onChange={(event) => setContent("body", event.target.value)} className="min-h-28 border-white/15 bg-white/8 text-white" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Button label">
                <Input
                  value={ctaValue(section.content.cta).label}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), label: event.target.value })}
                  className="border-white/15 bg-white/8 text-white"
                />
              </Field>
              <Field label="Button link">
                <Input
                  value={ctaValue(section.content.cta).href}
                  onChange={(event) => setContent("cta", { ...ctaValue(section.content.cta), href: event.target.value })}
                  className="border-white/15 bg-white/8 text-white"
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
                className="min-h-48 border-white/15 bg-white/8 text-white"
              />
            </Field>
            {section.variant === "what_we_do_gallery" ? (
              <ImageObjectListEditor
                title="Grid images"
                images={whatWeDoImages}
                assets={assets}
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
            onChange={(images) => setContent("items", images)}
          />
        ) : null}

        {section.type === "gallery_masonry" ? (
          <div className="rounded-md border border-white/10 bg-black/24 p-4">
            <p className="text-sm font-medium">Photo gallery source</p>
            <p className="mt-2 text-sm leading-6 text-white/48">
              This page pulls images from Gallery Manager collections. Use Gallery Manager to add, remove, or reorder photo
              groups. The page design is controlled here.
            </p>
            <Link className="mt-4 inline-flex text-sm text-white underline underline-offset-4" href="/admin/gallery">
              Open Gallery Manager
            </Link>
          </div>
        ) : null}

        {section.type === "member_grid" ? (
          <div className="rounded-md border border-white/10 bg-black/24 p-4">
            <p className="text-sm font-medium">Founding members source</p>
            <p className="mt-2 text-sm leading-6 text-white/48">Member cards come from Founding Members Manager. Text and design stay editable here.</p>
            <Link className="mt-4 inline-flex text-sm text-white underline underline-offset-4" href="/admin/members">
              Open Members Manager
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
          <Field label="Top spacing">
            <Input
              placeholder="7rem"
              value={stringValue(section.spacing, "top")}
              onChange={(event) => onChange((current) => ({ ...current, spacing: { ...current.spacing, top: event.target.value } }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </Field>
          <Field label="Bottom spacing">
            <Input
              placeholder="7rem"
              value={stringValue(section.spacing, "bottom")}
              onChange={(event) => onChange((current) => ({ ...current, spacing: { ...current.spacing, bottom: event.target.value } }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </Field>
          <Field label="Background token">
            <Input
              placeholder="softWhite"
              value={stringValue(section.background, "token")}
              onChange={(event) => onChange((current) => ({ ...current, background: { ...current.background, token: event.target.value } }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </Field>
        </div>

      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-white/55">{label}</Label>
      {children}
    </div>
  );
}

function ImageListEditor({
  title,
  description,
  images,
  assets,
  maxImages,
  onChange,
}: {
  title: string;
  description: string;
  images: string[];
  assets: MediaAsset[];
  maxImages?: number;
  onChange: (paths: string[]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
      <SelectedImages images={images} onChange={onChange} />
      <MediaPicker assets={assets} selected={images} maxImages={maxImages} onChange={onChange} />
    </div>
  );
}

function ImageObjectListEditor({
  title,
  images,
  assets,
  onChange,
}: {
  title: string;
  images: Array<{ src: string; alt: string; caption: string }>;
  assets: MediaAsset[];
  onChange: (images: Array<{ src: string; alt: string; caption: string }>) => void;
}) {
  const paths = images.map((image) => image.src);
  return (
    <ImageListEditor
      title={title}
      description="Pick images visually. Captions can be edited after selecting."
      images={paths}
      assets={assets}
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
        <figure key={`${src}-${index}`} className="overflow-hidden rounded-md border border-white/10 bg-black/30">
          <div className="relative aspect-[4/3]">
            <Image src={src} alt="" fill className="object-cover" sizes="220px" unoptimized={src.startsWith("http")} />
          </div>
          <figcaption className="grid gap-2 p-3">
            <span className="truncate text-xs text-white/40">Selected image {index + 1}</span>
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
  selected,
  maxImages,
  onChange,
}: {
  assets: MediaAsset[];
  selected: string[];
  maxImages?: number;
  onChange: (paths: string[]) => void;
}) {
  return (
    <DriveImagePicker
      assets={assets}
      selectedUrls={selected}
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
