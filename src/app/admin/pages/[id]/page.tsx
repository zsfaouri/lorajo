"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PageSection {
  id: string;
  type: string;
  variant: string;
  content: any;
  settings: any;
  sortOrder: number;
  isVisible: boolean;
  spacing: any;
  background: any;
  alignment: string | null;
}

interface PageData {
  id: string;
  locale: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
  status: string;
  sections: PageSection[];
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const SECTION_TYPES = [
  "hero",
  "video_scroll_hero",
  "rich_text",
  "image_text",
  "gallery_grid",
  "gallery_masonry",
  "project_grid",
  "event_list",
  "member_grid",
  "quote",
  "timeline",
  "stats",
  "map",
  "contact_form",
  "newsletter_signup",
  "cta",
  "heritage_story",
  "text_marquee",
  "image_carousel",
  "neighborhood_archive",
];

const TYPE_COLORS: Record<string, string> = {
  hero: "bg-purple-100 text-purple-700",
  video_scroll_hero: "bg-purple-100 text-purple-700",
  rich_text: "bg-blue-100 text-blue-700",
  image_text: "bg-cyan-100 text-cyan-700",
  gallery_grid: "bg-pink-100 text-pink-700",
  gallery_masonry: "bg-pink-100 text-pink-700",
  project_grid: "bg-indigo-100 text-indigo-700",
  event_list: "bg-orange-100 text-orange-700",
  member_grid: "bg-teal-100 text-teal-700",
  quote: "bg-amber-100 text-amber-700",
  timeline: "bg-lime-100 text-lime-700",
  stats: "bg-emerald-100 text-emerald-700",
  map: "bg-sky-100 text-sky-700",
  contact_form: "bg-rose-100 text-rose-700",
  newsletter_signup: "bg-violet-100 text-violet-700",
  cta: "bg-red-100 text-red-700",
  heritage_story: "bg-yellow-100 text-yellow-700",
  text_marquee: "bg-fuchsia-100 text-fuchsia-700",
  image_carousel: "bg-pink-100 text-pink-700",
  neighborhood_archive: "bg-stone-100 text-stone-700",
};

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Page meta form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoImage, setSeoImage] = useState("");
  const [status, setStatus] = useState("DRAFT");

  // Section editing
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionEdits, setSectionEdits] = useState<Record<string, any>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Add section dropdown
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [addingSection, setAddingSection] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPage = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/pages/${id}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      const data: PageData = await res.json();
      setPage(data);
      setTitle(data.title);
      setSlug(data.slug);
      setSeoTitle(data.seoTitle || "");
      setSeoDescription(data.seoDescription || "");
      setSeoImage(data.seoImage || "");
      setStatus(data.status);
    } catch {
      showToast("Failed to load page", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  async function handleSaveMeta() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          seoImage: seoImage || null,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Page saved", "success");
      fetchPage();
    } catch {
      showToast("Failed to save page", "error");
    } finally {
      setSaving(false);
    }
  }

  // --- Sections ---

  function getSectionEdit(section: PageSection) {
    if (sectionEdits[section.id]) return sectionEdits[section.id];
    return {
      variant: section.variant || "",
      content: JSON.stringify(section.content ?? {}, null, 2),
      settings: JSON.stringify(section.settings ?? {}, null, 2),
      spacing: typeof section.spacing === "string" ? section.spacing : JSON.stringify(section.spacing ?? ""),
      background: typeof section.background === "string" ? section.background : JSON.stringify(section.background ?? ""),
      alignment: section.alignment || "left",
      isVisible: section.isVisible,
    };
  }

  function updateSectionEdit(sectionId: string, field: string, value: any) {
    setSectionEdits((prev) => ({
      ...prev,
      [sectionId]: {
        ...getSectionEditById(sectionId),
        [field]: value,
      },
    }));
  }

  function getSectionEditById(sectionId: string) {
    if (sectionEdits[sectionId]) return sectionEdits[sectionId];
    const section = page?.sections.find((s) => s.id === sectionId);
    if (!section) return {};
    return getSectionEdit(section);
  }

  function toggleSection(sectionId: string) {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      // Initialize edit state from the section data
      const section = page?.sections.find((s) => s.id === sectionId);
      if (section && !sectionEdits[sectionId]) {
        setSectionEdits((prev) => ({
          ...prev,
          [sectionId]: getSectionEdit(section),
        }));
      }
    }
  }

  async function handleSaveSection(sectionId: string) {
    const edit = getSectionEditById(sectionId);
    let content: any;
    let settings: any;
    try {
      content = JSON.parse(edit.content);
    } catch {
      showToast("Invalid JSON in content field", "error");
      return;
    }
    try {
      settings = JSON.parse(edit.settings);
    } catch {
      showToast("Invalid JSON in settings field", "error");
      return;
    }

    setSavingSection(sectionId);
    try {
      const res = await fetch(`/api/admin/pages/${id}/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant: edit.variant,
          content,
          settings,
          spacing: edit.spacing || null,
          background: edit.background || null,
          alignment: edit.alignment || null,
          isVisible: edit.isVisible,
        }),
      });
      if (!res.ok) throw new Error("Failed to save section");
      showToast("Section saved", "success");
      setSectionEdits((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
      setExpandedSection(null);
      fetchPage();
    } catch {
      showToast("Failed to save section", "error");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleDeleteSection(sectionId: string, type: string) {
    if (!window.confirm(`Delete ${type} section? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}/sections/${sectionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete section");
      showToast("Section deleted", "success");
      if (expandedSection === sectionId) setExpandedSection(null);
      fetchPage();
    } catch {
      showToast("Failed to delete section", "error");
    }
  }

  async function handleAddSection(type: string) {
    setAddingSection(true);
    setShowAddDropdown(false);
    try {
      const res = await fetch(`/api/admin/pages/${id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          variant: "default",
          content: {},
          settings: {},
        }),
      });
      if (!res.ok) throw new Error("Failed to add section");
      showToast(`${type} section added`, "success");
      fetchPage();
    } catch {
      showToast("Failed to add section", "error");
    } finally {
      setAddingSection(false);
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    if (!page) return;
    const sections = [...page.sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;

    // Swap
    [sections[index], sections[swapIndex]] = [sections[swapIndex], sections[index]];
    const orderedIds = sections.map((s) => s.id);

    // Optimistic update
    setPage({ ...page, sections });

    try {
      const res = await fetch(`/api/admin/pages/${id}/sections/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    } catch {
      showToast("Failed to reorder sections", "error");
      fetchPage();
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-8 text-center">Loading...</div>
    );
  }

  if (!page) {
    return (
      <div className="text-sm text-red-500 py-8 text-center">Page not found.</div>
    );
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

      {/* Back link */}
      <Link
        href="/admin/pages"
        className="text-sm text-blue-600 hover:text-blue-800 hover:underline mb-4 inline-block"
      >
        &larr; Back to Pages
      </Link>

      {/* Page Meta */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Page</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
            <input
              type="text"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Image URL</label>
            <input
              type="text"
              value={seoImage}
              onChange={(e) => setSeoImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveMeta}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Sections ({page.sections.length})
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              disabled={addingSection}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addingSection ? "Adding..." : "Add Section"}
            </button>
            {showAddDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddSection(type)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    {type.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {page.sections.length === 0 ? (
          <div className="text-sm text-gray-500 py-8 text-center">
            No sections yet. Click &quot;Add Section&quot; to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {page.sections.map((section, index) => {
              const isExpanded = expandedSection === section.id;
              const edit = getSectionEdit(section);
              const colorClass = TYPE_COLORS[section.type] || "bg-gray-100 text-gray-700";

              return (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Section header row */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                    {/* Reorder arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleReorder(index, "up")}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                        title="Move up"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => handleReorder(index, "down")}
                        disabled={index === page.sections.length - 1}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                        title="Move down"
                      >
                        &#9660;
                      </button>
                    </div>

                    {/* Type badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      {section.type.replace(/_/g, " ")}
                    </span>

                    {/* Variant */}
                    <span className="text-sm text-gray-600">{section.variant}</span>

                    {/* Visibility */}
                    <span
                      className={`text-xs ${
                        section.isVisible ? "text-green-600" : "text-gray-400"
                      }`}
                      title={section.isVisible ? "Visible" : "Hidden"}
                    >
                      {section.isVisible ? "Visible" : "Hidden"}
                    </span>

                    <div className="flex-1" />

                    {/* Edit / Delete */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {isExpanded ? "Collapse" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id, section.type)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="px-4 py-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={section.type}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variant
                          </label>
                          <input
                            type="text"
                            value={sectionEdits[section.id]?.variant ?? edit.variant}
                            onChange={(e) =>
                              updateSectionEdit(section.id, "variant", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content (JSON)
                        </label>
                        <textarea
                          rows={6}
                          value={sectionEdits[section.id]?.content ?? edit.content}
                          onChange={(e) =>
                            updateSectionEdit(section.id, "content", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Settings (JSON)
                        </label>
                        <textarea
                          rows={4}
                          value={sectionEdits[section.id]?.settings ?? edit.settings}
                          onChange={(e) =>
                            updateSectionEdit(section.id, "settings", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Spacing
                          </label>
                          <input
                            type="text"
                            value={sectionEdits[section.id]?.spacing ?? edit.spacing}
                            onChange={(e) =>
                              updateSectionEdit(section.id, "spacing", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Background
                          </label>
                          <input
                            type="text"
                            value={sectionEdits[section.id]?.background ?? edit.background}
                            onChange={(e) =>
                              updateSectionEdit(section.id, "background", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alignment
                          </label>
                          <select
                            value={sectionEdits[section.id]?.alignment ?? edit.alignment}
                            onChange={(e) =>
                              updateSectionEdit(section.id, "alignment", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`visible-${section.id}`}
                          checked={sectionEdits[section.id]?.isVisible ?? edit.isVisible}
                          onChange={(e) =>
                            updateSectionEdit(section.id, "isVisible", e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`visible-${section.id}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Visible
                        </label>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSaveSection(section.id)}
                          disabled={savingSection === section.id}
                          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingSection === section.id ? "Saving..." : "Save Section"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
