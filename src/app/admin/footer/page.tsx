"use client";

import { useEffect, useState, useCallback } from "react";

type Locale = "EN" | "AR";

interface FooterColumn {
  id: string;
  locale: Locale;
  title: string;
  sortOrder: number;
  content: any;
  links: any;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastCounter = 0;

export default function FooterPage() {
  const [locale, setLocale] = useState<Locale>("EN");
  const [allItems, setAllItems] = useState<FooterColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLinks, setEditLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("{}");
  const [newLinks, setNewLinks] = useState("[]");
  const [adding, setAdding] = useState(false);
  const [addJsonError, setAddJsonError] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/footer");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAllItems(data);
    } catch {
      addToast("Failed to load footer columns", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const items = allItems.filter((item) => item.locale === locale);

  function startEdit(item: FooterColumn) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(JSON.stringify(item.content, null, 2));
    setEditLinks(JSON.stringify(item.links, null, 2));
    setJsonError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditLinks("");
    setJsonError(null);
  }

  async function saveEdit(id: string) {
    let parsedContent: any;
    let parsedLinks: any;
    try {
      parsedContent = JSON.parse(editContent);
    } catch {
      setJsonError("Content is not valid JSON");
      return;
    }
    try {
      parsedLinks = JSON.parse(editLinks);
    } catch {
      setJsonError("Links is not valid JSON");
      return;
    }
    setJsonError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/footer/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: parsedContent, links: parsedLinks }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast("Footer column updated", "success");
      cancelEdit();
      await fetchItems();
    } catch {
      addToast("Failed to update footer column", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this footer column?")) return;
    try {
      const res = await fetch(`/api/admin/footer/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast("Footer column deleted", "success");
      await fetchItems();
    } catch {
      addToast("Failed to delete footer column", "error");
    }
  }

  async function addColumn() {
    if (!newTitle.trim()) return;
    let parsedContent: any;
    let parsedLinks: any;
    try {
      parsedContent = JSON.parse(newContent);
    } catch {
      setAddJsonError("Content is not valid JSON");
      return;
    }
    try {
      parsedLinks = JSON.parse(newLinks);
    } catch {
      setAddJsonError("Links is not valid JSON");
      return;
    }
    setAddJsonError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/admin/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, title: newTitle, content: parsedContent, links: parsedLinks }),
      });
      if (!res.ok) throw new Error("Failed to create");
      addToast("Footer column added", "success");
      setNewTitle("");
      setNewContent("{}");
      setNewLinks("[]");
      setShowAdd(false);
      await fetchItems();
    } catch {
      addToast("Failed to add footer column", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Footer</h1>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddJsonError(null); }}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showAdd ? "Cancel" : "Add Column"}
        </button>
      </div>

      {/* Locale Tabs */}
      <div className="flex gap-2 mb-6">
        {(["EN", "AR"] as Locale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => { setLocale(loc); cancelEdit(); setShowAdd(false); }}
            className={`px-4 py-2 rounded text-sm font-medium ${
              locale === loc
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Footer Column</h2>
          {addJsonError && (
            <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{addJsonError}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Quick Links"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (JSON)</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Links (JSON)</label>
              <textarea
                value={newLinks}
                onChange={(e) => setNewLinks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">Locale: {locale}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addColumn}
              disabled={adding || !newTitle.trim()}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewTitle(""); setNewContent("{}"); setNewLinks("[]"); setAddJsonError(null); }}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
          No footer columns found for {locale}.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              {editingId === item.id ? (
                /* Inline Edit Mode */
                <div>
                  {jsonError && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{jsonError}</div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content (JSON)</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Links (JSON)</label>
                      <textarea
                        value={editLinks}
                        onChange={(e) => setEditLinks(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={saving}
                      className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {Array.isArray(item.links) ? `${item.links.length} link(s)` : "No links"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="px-4 py-2 rounded text-sm font-medium bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
