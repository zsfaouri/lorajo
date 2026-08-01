"use client";

import { useEffect, useState, useCallback } from "react";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: unknown;
  startsAt: string;
  endsAt: string;
  location: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  locale: string;
  mediaAssetId: string | null;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const LOCALE_TABS = ["All", "EN", "AR"] as const;

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  ARCHIVED: "bg-gray-200 text-gray-700",
};

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  startsAt: "",
  endsAt: "",
  location: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  locale: "EN",
  mediaAssetId: "",
};

let toastCounter = 0;

export default function EventsEditorPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocale, setActiveLocale] = useState<string>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query = activeLocale !== "All" ? `?locale=${activeLocale}` : "";
      const res = await fetch(`/api/admin/events${query}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data: EventItem[] = await res.json();
      setEvents(data);
    } catch {
      addToast("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  }, [activeLocale, addToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowCreate(false);
    setEditingId(null);
  }

  function startEdit(event: EventItem) {
    setShowCreate(false);
    setEditingId(event.id);
    setForm({
      title: event.title,
      slug: event.slug,
      summary: event.summary ?? "",
      content: event.content ? JSON.stringify(event.content, null, 2) : "",
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      location: event.location ?? "",
      status: event.status,
      locale: event.locale ?? "EN",
      mediaAssetId: event.mediaAssetId ?? "",
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowCreate(true);
  }

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function buildPayload() {
    let parsedContent: unknown = null;
    if (form.content.trim()) {
      try {
        parsedContent = JSON.parse(form.content);
      } catch {
        addToast("Content must be valid JSON", "error");
        return null;
      }
    }
    return {
      title: form.title,
      slug: form.slug,
      summary: form.summary || null,
      content: parsedContent,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      location: form.location || null,
      status: form.status,
      locale: form.locale,
      mediaAssetId: form.mediaAssetId || null,
    };
  }

  async function handleCreate() {
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create event");
      addToast("Event created", "success");
      resetForm();
      fetchEvents();
    } catch {
      addToast("Failed to create event", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    const payload = buildPayload();
    if (!payload) return;
    const { locale: _, ...updatePayload } = payload;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) throw new Error("Failed to update event");
      addToast("Event updated", "success");
      resetForm();
      fetchEvents();
    } catch {
      addToast("Failed to update event", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      addToast("Event deleted", "success");
      if (editingId === id) resetForm();
      fetchEvents();
    } catch {
      addToast("Failed to delete event", "error");
    }
  }

  function renderForm(mode: "create" | "edit") {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {mode === "create" ? "New Event" : "Edit Event"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleField("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => handleField("slug", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea
              value={form.summary}
              onChange={(e) => handleField("summary", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (JSON)</label>
            <textarea
              value={form.content}
              onChange={(e) => handleField("content", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => handleField("startsAt", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => handleField("endsAt", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => handleField("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleField("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
              <select
                value={form.locale}
                onChange={(e) => handleField("locale", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EN">EN</option>
                <option value="AR">AR</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media Asset ID</label>
            <input
              type="text"
              value={form.mediaAssetId}
              onChange={(e) => handleField("mediaAssetId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={mode === "create" ? handleCreate : handleUpdate}
            disabled={submitting}
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2 rounded text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={startCreate}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          New Event
        </button>
      </div>

      {/* Locale tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {LOCALE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveLocale(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLocale === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && renderForm("create")}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-sm py-10 text-center">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
          No events found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700">Location</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{event.title}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(event.startsAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{event.location || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[event.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(event)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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

      {/* Edit form (inline below table, for the selected event) */}
      {editingId && renderForm("edit")}
    </div>
  );
}
