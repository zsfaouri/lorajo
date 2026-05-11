"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NavigationItem = {
  locale: "EN" | "AR";
  label: string;
  path: string;
  sortOrder: number;
  isVisible: boolean;
};

export function NavigationFormEditor({ initialItems }: { initialItems: NavigationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState("");

  function update(index: number, patch: Partial<NavigationItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    setStatus("Saving...");
    const response = await fetch("/api/admin/navigation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const result = await response.json();
    setStatus(response.ok ? "Saved" : result.error ?? "Save failed");
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Navigation</p>
        <h1 className="mt-3 text-4xl font-medium">Menu links</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Edit menu labels, links, order, language, and visibility.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.map((item, index) => (
            <div key={`${item.locale}-${item.path}-${index}`} className="grid gap-3 rounded-md border border-white/10 bg-black/24 p-4 md:grid-cols-[90px_1fr_1fr_90px_120px]">
              <div className="grid gap-1.5">
                <Label className="text-white/55">Language</Label>
                <select value={item.locale} onChange={(event) => update(index, { locale: event.target.value as "EN" | "AR" })} className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white">
                  <option value="EN">EN</option>
                  <option value="AR">AR</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Label</Label>
                <Input value={item.label} onChange={(event) => update(index, { label: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Link</Label>
                <Input value={item.path} onChange={(event) => update(index, { path: event.target.value })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Order</Label>
                <Input type="number" value={item.sortOrder} onChange={(event) => update(index, { sortOrder: Number(event.target.value) })} className="border-white/15 bg-white/8 text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-white/55">Visible</Label>
                <select value={item.isVisible ? "yes" : "no"} onChange={(event) => update(index, { isVisible: event.target.value === "yes" })} className="h-10 rounded-md border border-white/15 bg-[#151515] px-3 text-sm text-white">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, { locale: "EN", label: "New link", path: "/en", sortOrder: current.length + 1, isVisible: true }])}>
            Add link
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" variant="admin" onClick={save}>
          Save menu
        </Button>
        <span className="text-sm text-white/45">{status}</span>
      </div>
    </div>
  );
}
