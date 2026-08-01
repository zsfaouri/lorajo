"use client";

import { useEffect, useState, useCallback } from "react";

interface ThemeData {
  id: string;
  name: string;
  isActive: boolean;
  tokens: Record<string, string>;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const COLOR_KEYS = ["color", "bg", "border", "text"];
const TYPOGRAPHY_KEYS = ["font", "text", "line", "letter"];
const SPACING_KEYS = ["space", "gap", "padding", "margin"];

function categorizeToken(key: string): "colors" | "typography" | "spacing" | "other" {
  const lower = key.toLowerCase();
  if (COLOR_KEYS.some((k) => lower.includes(k))) return "colors";
  if (TYPOGRAPHY_KEYS.some((k) => lower.includes(k))) return "typography";
  if (SPACING_KEYS.some((k) => lower.includes(k))) return "spacing";
  return "other";
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isColorValue(value: string): boolean {
  return /^#([0-9a-fA-F]{3,8})$/.test(value.trim());
}

let toastCounter = 0;

export default function ThemeEditorPage() {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/theme");
        if (!res.ok) throw new Error("Failed to load theme");
        const data: ThemeData = await res.json();
        setTheme(data);
        setTokens(data.tokens ?? {});
      } catch {
        addToast("Failed to load theme data", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  function handleTokenChange(key: string, value: string) {
    setTokens((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!theme) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...theme, tokens }),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      const updated: ThemeData = await res.json();
      setTheme(updated);
      setTokens(updated.tokens ?? {});
      addToast("Theme saved successfully", "success");
    } catch {
      addToast("Failed to save theme", "error");
    } finally {
      setSaving(false);
    }
  }

  const grouped = Object.entries(tokens).reduce(
    (acc, [key, value]) => {
      const category = categorizeToken(key);
      if (!acc[category]) acc[category] = [];
      acc[category].push({ key, value });
      return acc;
    },
    {} as Record<string, { key: string; value: string }[]>,
  );

  const categoryOrder: { key: string; label: string }[] = [
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Typography" },
    { key: "spacing", label: "Spacing" },
    { key: "other", label: "Other" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Loading theme...</p>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500 text-sm">Failed to load theme.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded shadow text-sm text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            {theme.name}
            {theme.isActive && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>

      {categoryOrder.map(({ key: catKey, label: catLabel }) => {
        const items = grouped[catKey];
        if (!items || items.length === 0) return null;
        return (
          <div key={catKey} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{catLabel}</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(({ key, value }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatLabel(key)}
                    </label>
                    <div className="flex items-center gap-2">
                      {(catKey === "colors" || isColorValue(value)) && (
                        <input
                          type="color"
                          value={isColorValue(value) ? value : "#000000"}
                          onChange={(e) => handleTokenChange(key, e.target.value)}
                          className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                        />
                      )}
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleTokenChange(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {Object.keys(tokens).length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
          No theme tokens defined.
        </div>
      )}
    </div>
  );
}
