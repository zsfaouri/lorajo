"use client";

import { useEffect, useState, useCallback } from "react";

type Locale = "EN" | "AR";

interface NavItem {
  id: string;
  locale: Locale;
  label: string;
  path: string;
  sortOrder: number;
  isVisible: boolean;
  parentId: string | null;
  children: NavItem[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastCounter = 0;

export default function NavigationPage() {
  const [locale, setLocale] = useState<Locale>("EN");
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editVisible, setEditVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPath, setNewPath] = useState("");
  const [adding, setAdding] = useState(false);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/navigation?locale=${locale}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
    } catch {
      addToast("Failed to load navigation items", "error");
    } finally {
      setLoading(false);
    }
  }, [locale, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function startEdit(item: NavItem) {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditPath(item.path);
    setEditVisible(item.isVisible);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditPath("");
    setEditVisible(true);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/navigation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel, path: editPath, isVisible: editVisible }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast("Navigation item updated", "success");
      cancelEdit();
      await fetchItems();
    } catch {
      addToast("Failed to update navigation item", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this navigation item?")) return;
    try {
      const res = await fetch(`/api/admin/navigation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast("Navigation item deleted", "success");
      await fetchItems();
    } catch {
      addToast("Failed to delete navigation item", "error");
    }
  }

  async function addItem() {
    if (!newLabel.trim() || !newPath.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, label: newLabel, path: newPath }),
      });
      if (!res.ok) throw new Error("Failed to create");
      addToast("Navigation item added", "success");
      setNewLabel("");
      setNewPath("");
      setShowAdd(false);
      await fetchItems();
    } catch {
      addToast("Failed to add navigation item", "error");
    } finally {
      setAdding(false);
    }
  }

  async function reorder(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
    try {
      const res = await fetch("/api/admin/navigation/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, orderedIds: newItems.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      addToast("Order updated", "success");
    } catch {
      addToast("Failed to reorder", "error");
      await fetchItems();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Navigation</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showAdd ? "Cancel" : "Add Item"}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Navigation Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. About Us"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. /about"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">Locale: {locale}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addItem}
              disabled={adding || !newLabel.trim() || !newPath.trim()}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(""); setNewPath(""); }}
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
          No navigation items found for {locale}.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              {editingId === item.id ? (
                /* Inline Edit Mode */
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                      <input
                        type="text"
                        value={editPath}
                        onChange={(e) => setEditPath(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id={`visible-${item.id}`}
                      checked={editVisible}
                      onChange={(e) => setEditVisible(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`visible-${item.id}`} className="text-sm text-gray-700">
                      Visible
                    </label>
                  </div>
                  <div className="flex gap-2">
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
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.path}</div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        item.isVisible
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => reorder(index, "up")}
                      disabled={index === 0}
                      className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      title="Move up"
                    >
                      &uarr;
                    </button>
                    <button
                      onClick={() => reorder(index, "down")}
                      disabled={index === items.length - 1}
                      className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      title="Move down"
                    >
                      &darr;
                    </button>
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
