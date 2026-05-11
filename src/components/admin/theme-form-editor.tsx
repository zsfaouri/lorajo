"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ThemeTokens } from "@/types/cms";

const colorFields = [
  ["softWhite", "Soft white"],
  ["black", "Black"],
  ["heritageGreen", "Heritage green"],
  ["lightNeutral", "Light neutral"],
  ["stone", "Stone"],
  ["parchment", "Parchment"],
  ["terracotta", "Terracotta"],
  ["olive", "Olive"],
  ["jasmine", "Jasmine"],
  ["stoneLight", "Stone light"],
] as const;

const spacingFields = [
  ["sectionSmall", "Small section spacing"],
  ["sectionMedium", "Medium section spacing"],
  ["sectionLarge", "Large section spacing"],
  ["pageX", "Page side spacing"],
] as const;

export function ThemeFormEditor({ initialTheme }: { initialTheme: ThemeTokens }) {
  const [theme, setTheme] = useState(initialTheme);
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Saving...");
    const response = await fetch("/api/admin/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: theme }),
    });
    const result = await response.json();
    setStatus(response.ok ? "Saved" : result.error ?? "Save failed");
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Theme Studio</p>
        <h1 className="mt-3 text-4xl font-medium">Site style</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">Change colors, typography, spacing, and corners with normal fields.</p>
      </div>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Colors</CardTitle>
          <CardDescription className="text-white/45">Pick the public site color tokens.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colorFields.map(([key, label]) => (
            <div key={key} className="grid gap-2">
              <Label className="text-white/55">{label}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.colors[key] ?? "#000000"}
                  onChange={(event) => setTheme((current) => ({ ...current, colors: { ...current.colors, [key]: event.target.value } }))}
                  className="h-10 w-14 border-white/15 bg-white/8 p-1"
                />
                <Input
                  value={theme.colors[key] ?? ""}
                  onChange={(event) => setTheme((current) => ({ ...current, colors: { ...current.colors, [key]: event.target.value } }))}
                  className="border-white/15 bg-white/8 text-white"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Typography and spacing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-white/55">Font stack</Label>
            <Input
              value={theme.typography.fontSans}
              onChange={(event) => setTheme((current) => ({ ...current, typography: { ...current.typography, fontSans: event.target.value } }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-white/55">Heading weight</Label>
            <Input
              value={theme.typography.headingWeight}
              onChange={(event) => setTheme((current) => ({ ...current, typography: { ...current.typography, headingWeight: event.target.value } }))}
              className="border-white/15 bg-white/8 text-white"
            />
          </div>
          {spacingFields.map(([key, label]) => (
            <div key={key} className="grid gap-2">
              <Label className="text-white/55">{label}</Label>
              <Input
                value={theme.spacing[key] ?? ""}
                onChange={(event) => setTheme((current) => ({ ...current, spacing: { ...current.spacing, [key]: event.target.value } }))}
                className="border-white/15 bg-white/8 text-white"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" variant="admin" onClick={save}>
          Save style
        </Button>
        <span className="text-sm text-white/45">{status}</span>
      </div>
    </div>
  );
}
