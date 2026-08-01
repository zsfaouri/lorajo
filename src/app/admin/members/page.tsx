"use client";

import { useEffect, useState, useCallback } from "react";

type Locale = "EN" | "AR";

interface Member {
  id: string;
  locale: Locale;
  name: string;
  slug: string;
  title: string | null;
  bio: any;
  sortOrder: number;
  isFounder: boolean;
  status: string;
  mediaAssetId: string | null;
  mediaAsset: any | null;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastCounter = 0;

export default function MembersPage() {
  const [locale, setLocale] = useState<Locale>("EN");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Edit modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editIsFounder, setEditIsFounder] = useState(false);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editMediaAssetId, setEditMediaAssetId] = useState("");
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBio, setNewBio] = useState("");
  const [adding, setAdding] = useState(false);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members?locale=${locale}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMembers(data);
    } catch {
      addToast("Failed to load members", "error");
    } finally {
      setLoading(false);
    }
  }, [locale, addToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function startEdit(member: Member) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditSlug(member.slug);
    setEditTitle(member.title ?? "");
    setEditBio(typeof member.bio === "string" ? member.bio : JSON.stringify(member.bio ?? "", null, 2));
    setEditIsFounder(member.isFounder);
    setEditStatus(member.status);
    setEditMediaAssetId(member.mediaAssetId ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          title: editTitle,
          bio: editBio,
          isFounder: editIsFounder,
          status: editStatus,
          mediaAssetId: editMediaAssetId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast("Member updated", "success");
      cancelEdit();
      await fetchMembers();
    } catch {
      addToast("Failed to update member", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast("Member deleted", "success");
      await fetchMembers();
    } catch {
      addToast("Failed to delete member", "error");
    }
  }

  async function addMember() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          name: newName,
          slug: newSlug || undefined,
          title: newTitle || undefined,
          bio: newBio || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      addToast("Member added", "success");
      setNewName("");
      setNewSlug("");
      setNewTitle("");
      setNewBio("");
      setShowAdd(false);
      await fetchMembers();
    } catch {
      addToast("Failed to add member", "error");
    } finally {
      setAdding(false);
    }
  }

  async function reorder(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= members.length) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[swapIndex]] = [newMembers[swapIndex], newMembers[index]];
    setMembers(newMembers);
    try {
      const res = await fetch("/api/admin/members/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, orderedIds: newMembers.map((m) => m.id) }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      addToast("Order updated", "success");
    } catch {
      addToast("Failed to reorder", "error");
      await fetchMembers();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showAdd ? "Cancel" : "Add Member"}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Director"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Short biography"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">Locale: {locale}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addMember}
              disabled={adding || !newName.trim()}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(""); setNewSlug(""); setNewTitle(""); setNewBio(""); }}
              className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Overlay */}
      {editingId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-founder"
                  checked={editIsFounder}
                  onChange={(e) => setEditIsFounder(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="edit-founder" className="text-sm text-gray-700">
                  Founder
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Asset ID</label>
                <input
                  type="text"
                  value={editMediaAssetId}
                  onChange={(e) => setEditMediaAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => saveEdit(editingId)}
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
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
          No members found for {locale}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, index) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  {member.title && (
                    <div className="text-sm text-gray-500">{member.title}</div>
                  )}
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
                    disabled={index === members.length - 1}
                    className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    title="Move down"
                  >
                    &darr;
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {member.isFounder && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                    Founder
                  </span>
                )}
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    member.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {member.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(member)}
                  className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="px-4 py-2 rounded text-sm font-medium bg-red-600 text-white"
                >
                  Delete
                </button>
              </div>
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
