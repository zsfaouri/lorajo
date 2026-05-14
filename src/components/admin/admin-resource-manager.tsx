"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, FilePenLine, Plus, Trash2, X } from "lucide-react";

import { DriveImagePicker, type DriveMediaAsset } from "@/components/admin/drive-image-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldType = "text" | "textarea" | "select" | "datetime" | "image" | "number";

type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  helpText?: string;
};

type ResourceItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  locale?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  content?: unknown;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function recordString(value: unknown, key: string) {
  const next = asRecord(value)[key];
  if (next == null) return "";
  if (typeof next === "string") return next;
  if (typeof next === "number" || typeof next === "boolean") return String(next);
  return "";
}

function entryBody(value: unknown) {
  return recordString(value, "body");
}

function toDateTimeInput(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getValue(item: ResourceItem, field: FieldConfig) {
  if (field.name === "summary") return String(item.summary ?? item.excerpt ?? "");
  if (field.name === "content" || field.name === "settings" || field.name === "metadata") return entryBody(item[field.name]);
  if (field.type === "datetime") return toDateTimeInput(item[field.name]);

  const direct = item[field.name];
  if (direct != null && typeof direct !== "object") return String(direct);

  const fromContent = recordString(item.content, field.name);
  if (fromContent) return fromContent;

  return "";
}

function imageFromItem(item: ResourceItem) {
  const direct = typeof item.imageUrl === "string" ? item.imageUrl : "";
  const seoImage = typeof item.seoImage === "string" ? item.seoImage : "";
  const contentImage = recordString(item.content, "imageUrl");
  return direct || seoImage || contentImage;
}

function itemTitle(item: ResourceItem) {
  return item.title ?? item.name ?? item.slug ?? item.id;
}

function normalizePayload(fields: FieldConfig[], values: Record<string, string>, mode: "create" | "edit") {
  const payload: Record<string, unknown> = {};
  const contentExtras: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.name] ?? "";
    const value = raw.trim();
    const isEmpty = value.length === 0;

    if (field.name === "content" || field.name === "settings" || field.name === "metadata") {
      if (!isEmpty || mode === "edit") payload[field.name] = { body: value };
      continue;
    }

    if (["imageUrl", "imageAlt", "actionLabel", "videoUrl", "invitationUrl"].includes(field.name)) {
      if (!isEmpty) {
        payload[field.name] = value;
        contentExtras[field.name] = value;
      } else if (mode === "edit") {
        payload[field.name] = null;
      }
      continue;
    }

    if (field.name === "sortOrder" || field.type === "number") {
      if (!isEmpty || mode === "edit") payload[field.name] = Number(value) || 0;
      continue;
    }

    if (field.type === "datetime") {
      if (!isEmpty) {
        payload[field.name] = new Date(value).toISOString();
      } else if (mode === "edit") {
        payload[field.name] = null;
      }
      continue;
    }

    if (isEmpty) {
      if (mode === "edit" && !["title", "name", "slug", "locale", "status"].includes(field.name)) {
        payload[field.name] = null;
      }
      continue;
    }

    if (value === "true" || value === "false") {
      payload[field.name] = value === "true";
      continue;
    }

    payload[field.name] = value;
  }

  if (Object.keys(contentExtras).length > 0) {
    const existingContent = payload.content && typeof payload.content === "object" && !Array.isArray(payload.content) ? payload.content : {};
    payload.content = { ...existingContent, ...contentExtras };
  }

  return payload;
}

function initialValuesForFields(fields: FieldConfig[]) {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.options?.[0]?.value ?? (field.name === "status" ? "DRAFT" : field.name === "locale" ? "EN" : ""),
    ]),
  ) as Record<string, string>;
}

function valuesFromItem(fields: FieldConfig[], item: ResourceItem) {
  return Object.fromEntries(fields.map((field) => [field.name, getValue(item, field)])) as Record<string, string>;
}

function previewHref(basePath: string, slug: string) {
  return slug === "home" ? basePath : `${basePath}/${slug}`;
}

function statusClasses(status?: string | null) {
  if (status === "PUBLISHED") return "border-[var(--color-heritage-green)]/30 bg-[var(--color-heritage-green)]/10 text-[var(--color-heritage-green)]";
  if (status === "ARCHIVED") return "border-black/10 bg-black/[0.04] text-black/45";
  return "border-[var(--color-terracotta)]/30 bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)]";
}

export function AdminResourceManager({
  title,
  description,
  endpoint,
  fields,
  initialItems,
  mediaAssets = [],
  previewBasePath,
  editBasePath,
}: {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  initialItems: ResourceItem[];
  mediaAssets?: DriveMediaAsset[];
  previewBasePath?: string;
  editBasePath?: string;
}) {
  const emptyValues = useMemo(() => initialValuesForFields(fields), [fields]);
  const [values, setValues] = useState<Record<string, string>>(emptyValues);
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string>("new");
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const mode = selectedItem ? "edit" : "create";
  const selectedDriveFolderId = typeof selectedItem?.driveFolderId === "string" ? selectedItem.driveFolderId : undefined;

  function beginCreate() {
    setSelectedId("new");
    setValues(emptyValues);
    setStatus("");
  }

  function beginEdit(item: ResourceItem) {
    setSelectedId(item.id);
    setValues(valuesFromItem(fields, item));
    setStatus("");
  }

  function setTitleAndMaybeSlug(name: string, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if ((name === "title" || name === "name") && !current.slug && fields.some((field) => field.name === "slug")) {
        next.slug = makeSlug(value);
      }
      return next;
    });
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(mode === "edit" ? "Saving changes..." : "Creating...");

    const response = await fetch(mode === "edit" ? `${endpoint}/${selectedItem?.id}` : endpoint, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizePayload(fields, values, mode)),
    });

    const json = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setStatus(json.error ?? "Save failed");
      return;
    }

    if (mode === "edit") {
      setItems((current) => current.map((item) => (item.id === json.id ? json : item)));
      setValues(valuesFromItem(fields, json));
      setStatus("Changes saved.");
      return;
    }

    setItems((current) => [json, ...current]);
    setSelectedId(json.id);
    setValues(valuesFromItem(fields, json));
    setStatus("Created.");
  }

  async function deleteItem(item: ResourceItem) {
    if (!window.confirm(`Delete "${itemTitle(item)}"?`)) return;

    setStatus("Deleting...");
    const response = await fetch(`${endpoint}/${item.id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Delete failed");
      return;
    }

    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    beginCreate();
    setStatus("Deleted.");
  }

  function renderField(field: FieldConfig) {
    const commonLabel = (
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-black/70">{field.label}</Label>
        {field.helpText ? <span className="text-xs text-black/42">{field.helpText}</span> : null}
      </div>
    );

    if (field.type === "textarea") {
      return (
        <div key={field.name} className="grid gap-1.5">
          {commonLabel}
          <Textarea
            value={values[field.name] ?? ""}
            placeholder={field.placeholder}
            onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
            className="min-h-28 border-black/10 bg-white text-black"
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name} className="grid gap-1.5">
          {commonLabel}
          <select
            value={values[field.name] ?? ""}
            onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
            className="h-11 rounded-[var(--radius-card)] border border-black/10 bg-white px-3 text-sm text-black outline-none focus:border-[var(--color-heritage-green)]"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "image") {
      return (
        <DriveImagePicker
          key={field.name}
          assets={mediaAssets}
          selectedUrls={values[field.name] ? [values[field.name]] : []}
          compact
          title={field.label}
          description="Choose from the synced Google Drive folders. Local upload and pasted files are not used here."
          folderId={selectedDriveFolderId}
          onPick={(asset) => {
            setTitleAndMaybeSlug(field.name, asset.url);
            if (!values.imageAlt) setTitleAndMaybeSlug("imageAlt", asset.alt ?? asset.caption ?? "");
          }}
        />
      );
    }

    return (
      <div key={field.name} className="grid gap-1.5">
        {commonLabel}
        <Input
          type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text"}
          value={values[field.name] ?? ""}
          placeholder={field.placeholder}
          onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
          className="border-black/10 bg-white text-black"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Admin</p>
          <h1 className="mt-3 text-4xl font-medium text-black">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-black/58">{description}</p>
        </div>
        <Button type="button" variant="green" onClick={beginCreate} className="w-full justify-center md:w-auto">
          <Plus size={16} />
          Create new
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="border-black/10 bg-white/78">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Records</CardTitle>
                <CardDescription>{items.length} total</CardDescription>
              </div>
              <Badge className="normal-case tracking-normal">{mode === "edit" ? "Editing" : "Creating"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <button
              type="button"
              onClick={beginCreate}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-colors",
                mode === "create"
                  ? "border-[var(--color-heritage-green)] bg-[var(--color-heritage-green)] text-white"
                  : "border-black/10 bg-white text-black/70 hover:border-[var(--color-heritage-green)]/40 hover:text-black",
              )}
            >
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", mode === "create" ? "bg-white/16" : "bg-[var(--color-soft-white)]")}>
                <Plus size={17} />
              </span>
              <span>
                <span className="block text-sm font-medium">New record</span>
                <span className={cn("mt-1 block text-xs", mode === "create" ? "text-white/70" : "text-black/42")}>Start a clean form</span>
              </span>
            </button>

            {items.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-black/15 bg-[var(--color-soft-white)] p-5 text-sm leading-6 text-black/55">
                No records yet. Press Create new, fill the form, then save.
              </div>
            ) : (
              <div className="grid max-h-[62vh] gap-2 overflow-auto pr-1">
                {items.map((item) => {
                  const image = imageFromItem(item);
                  const active = selectedItem?.id === item.id;
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "rounded-[var(--radius-card)] border p-3 transition-colors",
                        active ? "border-[var(--color-heritage-green)] bg-[var(--color-heritage-green)]/8" : "border-black/10 bg-white hover:border-black/20",
                      )}
                    >
                      <button type="button" onClick={() => beginEdit(item)} className="grid w-full grid-cols-[52px_1fr] gap-3 text-left">
                        <span className="relative h-13 w-13 overflow-hidden rounded-[var(--radius-card)] bg-black/5">
                          {image ? (
                            <Image src={image} alt={String(itemTitle(item))} fill className="object-cover" sizes="52px" unoptimized={image.startsWith("http")} />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-black/30">
                              <FilePenLine size={18} />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-black">{itemTitle(item)}</span>
                          <span className="mt-1 block truncate text-xs text-black/45">
                            {[String(item.locale ?? ""), String(item.slug ?? "")].filter(Boolean).join(" / ") || item.id}
                          </span>
                          {item.status ? (
                            <span className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]", statusClasses(String(item.status)))}>
                              {String(item.status).toLowerCase()}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-black/10 bg-white/82">
          <CardHeader className="border-b border-black/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{selectedItem ? `Edit ${itemTitle(selectedItem)}` : `Create ${title.toLowerCase()}`}</CardTitle>
                <CardDescription>
                  {mode === "edit" ? "Change fields, save, preview, or delete from one place." : "Fill the fields, choose Drive images, then save."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItem && editBasePath ? (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={`${editBasePath}/${selectedItem.id}`}>
                      <FilePenLine size={14} />
                      Full editor
                    </a>
                  </Button>
                ) : null}
                {selectedItem && previewBasePath && selectedItem.slug ? (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={previewHref(previewBasePath, String(selectedItem.slug))} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      Preview
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={saveItem} className="grid gap-6">
              <div className="grid gap-4 lg:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className={cn(field.type === "textarea" || field.type === "image" ? "lg:col-span-2" : "")}>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-black/10 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="green" disabled={isSaving}>
                    <CheckCircle2 size={16} />
                    {mode === "edit" ? "Save changes" : "Create record"}
                  </Button>
                  <Button type="button" variant="outline" onClick={beginCreate}>
                    <X size={16} />
                    Cancel
                  </Button>
                  {mode === "edit" && selectedItem ? (
                    <Button type="button" variant="outline" onClick={() => void deleteItem(selectedItem)} className="border-red-500/45 text-red-700 hover:bg-red-600 hover:text-white">
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  ) : null}
                </div>
                {status ? <p className="text-sm text-black/55">{status}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const localeField: FieldConfig = {
  name: "locale",
  label: "Language",
  type: "select",
  options: [
    { label: "English", value: "EN" },
    { label: "Arabic", value: "AR" },
  ],
};

export const statusField: FieldConfig = {
  name: "status",
  label: "Status",
  type: "select",
  options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Archived", value: "ARCHIVED" },
  ],
};
