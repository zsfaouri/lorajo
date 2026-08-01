"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface GalleryCollection {
  id: string;
  locale: string;
  title: string;
  slug: string;
  description: string | null;
  status: "PUBLISHED" | "DRAFT";
}

type LocaleTab = "ALL" | "EN" | "AR";

const LOCALE_TABS: LocaleTab[] = ["ALL", "EN", "AR"];

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg text-sm">
      {message}
    </div>
  );
}

export default function GalleryListPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LocaleTab>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Create form state
  const [newLocale, setNewLocale] = useState("EN");
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [creating, setCreating] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== "ALL" ? `?locale=${activeTab}` : "";
      const res = await fetch(`/api/admin/gallery${params}`);
      if (!res.ok) throw new Error("Failed to fetch collections");
      const data = await res.json();
      setCollections(data);
    } catch {
      setToast("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: newLocale,
          title: newTitle,
          slug: newSlug,
          description: newDescription || null,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      setToast("Collection created");
      setShowCreateForm(false);
      setNewLocale("EN");
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setNewStatus("DRAFT");
      fetchCollections();
    } catch {
      setToast("Failed to create collection");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete collection "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setToast("Collection deleted");
      fetchCollections();
    } catch {
      setToast("Failed to delete collection");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gallery Collections</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showCreateForm ? "Cancel" : "New Collection"}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Collection</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
                <select
                  value={newLocale}
                  onChange={(e) => setNewLocale(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EN">EN</option>
                  <option value="AR">AR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locale tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {LOCALE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "ALL" ? "All" : tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">Loading collections...</div>
      )}

      {/* Empty state */}
      {!loading && collections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No collections found. Create one to get started.
        </div>
      )}

      {/* Grid */}
      {!loading && collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow group relative"
              onClick={() => router.push(`/admin/gallery/${col.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {col.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    col.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {col.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                Locale: {col.locale} &middot; /{col.slug}
              </p>
              {col.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{col.description}</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(col.id, col.title);
                }}
                className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
