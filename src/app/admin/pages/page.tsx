"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PageItem {
  id: string;
  locale: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  sectionCount: number;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const LOCALES = ["All", "EN", "AR"] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PagesListPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocale, setActiveLocale] = useState<(typeof LOCALES)[number]>("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Create form state
  const [createLocale, setCreateLocale] = useState("EN");
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createStatus, setCreateStatus] = useState("DRAFT");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [creating, setCreating] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const query = activeLocale !== "All" ? `?locale=${activeLocale}` : "";
      const res = await fetch(`/api/admin/pages${query}`);
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data = await res.json();
      setPages(data);
    } catch {
      showToast("Failed to load pages", "error");
    } finally {
      setLoading(false);
    }
  }, [activeLocale, showToast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  function handleTitleChange(value: string) {
    setCreateTitle(value);
    if (!slugManuallyEdited) {
      setCreateSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setCreateSlug(value);
  }

  async function handleCreate() {
    if (!createTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: createLocale,
          title: createTitle.trim(),
          slug: createSlug || slugify(createTitle),
          status: createStatus,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create page");
      }
      showToast("Page created", "success");
      setShowCreateForm(false);
      setCreateTitle("");
      setCreateSlug("");
      setCreateStatus("DRAFT");
      setCreateLocale("EN");
      setSlugManuallyEdited(false);
      fetchPages();
    } catch (err: any) {
      showToast(err.message || "Failed to create page", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete page "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete page");
      showToast("Page deleted", "success");
      fetchPages();
    } catch {
      showToast("Failed to delete page", "error");
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showCreateForm ? "Cancel" : "New Page"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Create New Page</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
              <select
                value={createLocale}
                onChange={(e) => setCreateLocale(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EN">EN</option>
                <option value="AR">AR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Page title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={createSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Page"}
            </button>
          </div>
        </div>
      )}

      {/* Locale Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => setActiveLocale(locale)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLocale === locale
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {locale}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-sm text-gray-500 py-8 text-center">No pages found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-3 px-2 font-medium text-gray-500">Title</th>
                <th className="py-3 px-2 font-medium text-gray-500">Slug</th>
                <th className="py-3 px-2 font-medium text-gray-500">Locale</th>
                <th className="py-3 px-2 font-medium text-gray-500">Status</th>
                <th className="py-3 px-2 font-medium text-gray-500">Sections</th>
                <th className="py-3 px-2 font-medium text-gray-500">Updated</th>
                <th className="py-3 px-2 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <button
                      onClick={() => router.push(`/admin/pages/${page.id}`)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                    >
                      {page.title}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-gray-600 font-mono text-xs">{page.slug}</td>
                  <td className="py-3 px-2 text-gray-600">{page.locale}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{page.sectionCount}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{formatDate(page.updatedAt)}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleDelete(page.id, page.title)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
