"use client";

import { useEffect, useState, useCallback } from "react";

interface MediaAsset {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
  alt: string | null;
  caption: string | null;
  source: string | null;
  format: string | null;
}

type TypeTab = "ALL" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";

const TYPE_TABS: TypeTab[] = ["ALL", "IMAGE", "VIDEO", "DOCUMENT", "AUDIO"];
const PAGE_SIZE = 20;

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

function TypeIcon({ type }: { type: MediaAsset["type"] }) {
  const icons: Record<string, string> = {
    VIDEO: "Film",
    DOCUMENT: "Doc",
    AUDIO: "Audio",
  };
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="text-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto mb-1"
        >
          {type === "VIDEO" && (
            <>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" />
            </>
          )}
          {type === "DOCUMENT" && (
            <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </>
          )}
          {type === "AUDIO" && (
            <>
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </>
          )}
        </svg>
        <span className="text-xs font-medium">{icons[type] || type}</span>
      </div>
    </div>
  );
}

export default function MediaBrowserPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TypeTab>("ALL");
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<MediaAsset["type"]>("IMAGE");
  const [newAlt, setNewAlt] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (!res.ok) throw new Error("Failed to fetch media");
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setToast("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const filtered = activeTab === "ALL" ? assets : assets.filter((a) => a.type === activeTab);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          type: newType,
          alt: newAlt || null,
          caption: newCaption || null,
          source: newSource || null,
          format: newFormat || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create media");
      setToast("Media asset created");
      setShowAddForm(false);
      setNewUrl("");
      setNewType("IMAGE");
      setNewAlt("");
      setNewCaption("");
      setNewSource("");
      setNewFormat("");
      fetchAssets();
    } catch {
      setToast("Failed to create media asset");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(assetId: string) {
    if (!confirm("Delete this media asset? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/media/${assetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setToast("Media asset deleted");
      if (expandedId === assetId) setExpandedId(null);
      fetchAssets();
    } catch {
      setToast("Failed to delete media asset");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showAddForm ? "Cancel" : "Add Media"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Media Asset</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MediaAsset["type"])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="AUDIO">Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g., GOOGLE_DRIVE, UPLOAD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <input
                  type="text"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  placeholder="e.g., jpg, png, mp4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add Media"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">Loading media...</div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No media assets found. Add one to get started.
        </div>
      )}

      {/* Grid */}
      {!loading && paged.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paged.map((asset) => (
            <div key={asset.id}>
              {/* Card */}
              <div
                className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer group transition-shadow hover:shadow-md ${
                  expandedId === asset.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
              >
                {/* Preview */}
                <div className="aspect-square overflow-hidden">
                  {asset.type === "IMAGE" ? (
                    <img
                      src={asset.url}
                      alt={asset.alt || "Media asset"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <TypeIcon type={asset.type} />
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  {asset.alt && (
                    <p className="text-xs text-gray-600 truncate">{asset.alt}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {asset.source && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {asset.source}
                      </span>
                    )}
                    {asset.format && (
                      <span className="text-xs text-gray-400 uppercase">{asset.format}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === asset.id && (
                <div className="bg-white rounded-lg shadow p-4 mt-2 border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Details</h3>
                  <dl className="space-y-1 text-xs">
                    <div>
                      <dt className="text-gray-500">ID</dt>
                      <dd className="text-gray-800 font-mono break-all">{asset.id}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">URL</dt>
                      <dd className="text-gray-800 break-all">{asset.url}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Type</dt>
                      <dd className="text-gray-800">{asset.type}</dd>
                    </div>
                    {asset.alt && (
                      <div>
                        <dt className="text-gray-500">Alt</dt>
                        <dd className="text-gray-800">{asset.alt}</dd>
                      </div>
                    )}
                    {asset.caption && (
                      <div>
                        <dt className="text-gray-500">Caption</dt>
                        <dd className="text-gray-800">{asset.caption}</dd>
                      </div>
                    )}
                    {asset.source && (
                      <div>
                        <dt className="text-gray-500">Source</dt>
                        <dd className="text-gray-800">{asset.source}</dd>
                      </div>
                    )}
                    {asset.format && (
                      <div>
                        <dt className="text-gray-500">Format</dt>
                        <dd className="text-gray-800">{asset.format}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="px-3 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      Delete Asset
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}--{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
