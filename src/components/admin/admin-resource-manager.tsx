"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldType = "text" | "textarea" | "select" | "datetime";

type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
};

type ResourceItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  locale?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
};

function getValue(item: ResourceItem, key: string) {
  const value = item[key];
  if (value == null) return "";
  if (typeof value === "object") return "";
  return String(value);
}

function entryBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const body = (value as Record<string, unknown>).body;
  return typeof body === "string" ? body : "";
}

function normalizePayload(fields: FieldConfig[], values: Record<string, string>) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = values[field.name]?.trim();
    if (!value) continue;

    if (field.name === "content" || field.name === "settings" || field.name === "metadata") {
      payload[field.name] = { body: value };
      continue;
    }

    if (field.name === "sortOrder") {
      payload[field.name] = Number(value);
      continue;
    }

    if (field.type === "datetime") {
      payload[field.name] = new Date(value).toISOString();
      continue;
    }

    if (value === "true" || value === "false") {
      payload[field.name] = value === "true";
      continue;
    }

    payload[field.name] = value;
  }

  return payload;
}

export function AdminResourceManager({
  title,
  description,
  endpoint,
  fields,
  initialItems,
  previewBasePath,
  editBasePath,
}: {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  initialItems: ResourceItem[];
  previewBasePath?: string;
  editBasePath?: string;
}) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          field.options?.[0]?.value ?? (field.name === "status" ? "DRAFT" : field.name === "locale" ? "EN" : ""),
        ]),
      ) as Record<string, string>,
    [fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [status, setStatus] = useState<string>("");

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizePayload(fields, values)),
    });

    const json = await response.json();
    if (!response.ok) {
      setStatus(json.error ?? "Save failed");
      return;
    }

    setItems((current) => [json, ...current]);
    setValues(initialValues);
    setStatus("Saved");
  }

  function setTitleAndMaybeSlug(name: string, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === "title" || name === "name") {
        const hasSlug = fields.some((field) => field.name === "slug");
        if (hasSlug && !current.slug) {
          next.slug = value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }
      }
      return next;
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <section className="grid gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Admin</p>
          <h1 className="mt-3 text-4xl font-medium">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">{description}</p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Create</CardTitle>
          <CardDescription className="text-white/45">Fill normal fields only. Slugs are filled automatically from titles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createItem} className="grid gap-4">
              {fields.map((field) => (
                <div key={field.name} className="grid gap-1.5">
                  <Label className="text-white/55">{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
                      className="min-h-28 rounded-md border border-white/15 bg-white/8 px-3 py-2 text-sm text-white outline-none focus:border-white/35"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={values[field.name] ?? ""}
                      onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
                      className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white outline-none focus:border-white/35"
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type === "datetime" ? "datetime-local" : "text"}
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(event) => setTitleAndMaybeSlug(field.name, event.target.value)}
                      className="border-white/15 bg-white/8 text-white"
                    />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Button type="submit" variant="admin">
                  Save
                </Button>
                <span className="text-sm text-white/45">{status}</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Existing records</CardTitle>
          <CardDescription className="text-white/45">{items.length} records</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 bg-black/22 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg">{item.title ?? item.name ?? item.slug ?? item.id}</p>
                  <p className="mt-1 text-sm text-white/42">
                    {[getValue(item, "locale"), getValue(item, "slug"), getValue(item, "status")].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <div className="flex gap-3">
                  {editBasePath ? (
                    <a className="text-sm text-white/70 hover:text-white" href={`${editBasePath}/${item.id}`}>
                      Edit
                    </a>
                  ) : null}
                  {previewBasePath && item.slug ? (
                    <a className="text-sm text-white/70 hover:text-white" href={`${previewBasePath}/${item.slug}`} target="_blank">
                      Preview
                    </a>
                  ) : null}
                </div>
              </div>
              {item.summary ? <p className="mt-3 text-sm leading-6 text-white/52">{String(item.summary)}</p> : null}
              {!item.summary && item.content ? <p className="mt-3 text-sm leading-6 text-white/52">{entryBody(item.content)}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export const localeField: FieldConfig = {
  name: "locale",
  label: "Locale",
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
