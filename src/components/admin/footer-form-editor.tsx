"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isRecord } from "@/lib/utils";

type FooterColumnInput = {
  locale: "EN" | "AR";
  title: string;
  sortOrder: number;
  content: Record<string, unknown>;
  links: Array<Record<string, unknown>>;
};

function normalize(column: FooterColumnInput) {
  const content = isRecord(column.content) ? column.content : {};
  return {
    ...column,
    brandName: typeof content.brandName === "string" ? content.brandName : "",
    brandDescription: typeof content.brandDescription === "string" ? content.brandDescription : "",
    location: typeof content.location === "string" ? content.location : "",
    phone: typeof content.phone === "string" ? content.phone : "",
    email: typeof content.email === "string" ? content.email : "",
  };
}

export function FooterFormEditor({ initialColumns }: { initialColumns: FooterColumnInput[] }) {
  const [columns, setColumns] = useState(initialColumns.map(normalize));
  const [status, setStatus] = useState("");

  function update(index: number, patch: Partial<(typeof columns)[number]>) {
    setColumns((current) => current.map((column, columnIndex) => (columnIndex === index ? { ...column, ...patch } : column)));
  }

  async function save() {
    setStatus("Saving...");
    const payload = columns.map((column) => ({
      locale: column.locale,
      title: column.title,
      sortOrder: Number(column.sortOrder),
      content: {
        ...column.content,
        brandName: column.brandName,
        brandDescription: column.brandDescription,
        location: column.location,
        phone: column.phone,
        email: column.email,
      },
      links: column.links,
    }));
    const response = await fetch("/api/admin/footer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: payload }),
    });
    const result = await response.json();
    setStatus(response.ok ? "Saved" : result.error ?? "Save failed");
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Footer</p>
        <h1 className="mt-3 text-4xl font-medium">Footer content</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Edit the footer brand copy and contact details.</p>
      </div>

      <div className="grid gap-6">
        {columns.map((column, index) => (
          <Card key={`${column.locale}-${column.title}-${index}`} className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle>{column.locale} footer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-white/55">Language</Label>
                <select value={column.locale} onChange={(event) => update(index, { locale: event.target.value as "EN" | "AR" })} className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white">
                  <option value="EN">English</option>
                  <option value="AR">Arabic</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Title</Label>
                <Input value={column.title} onChange={(event) => update(index, { title: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Brand name</Label>
                <Input value={column.brandName} onChange={(event) => update(index, { brandName: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Phone</Label>
                <Input value={column.phone} onChange={(event) => update(index, { phone: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Email</Label>
                <Input value={column.email} onChange={(event) => update(index, { email: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Location</Label>
                <Input value={column.location} onChange={(event) => update(index, { location: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label className="text-white/55">Description</Label>
                <Textarea value={column.brandDescription} onChange={(event) => update(index, { brandDescription: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="admin" onClick={save}>
          Save footer
        </Button>
        <span className="text-sm text-white/45">{status}</span>
      </div>
    </div>
  );
}
