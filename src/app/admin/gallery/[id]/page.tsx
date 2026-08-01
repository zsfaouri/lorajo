"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface GalleryImage {
  id: string;
  mediaAssetId: string;
  url: string | null;
  alt: string | null;
  caption: string | null;
  sortOrder: number;
}

interface GalleryCollection {
  id: string;
  locale: string;
  title: string;
  slug: string;
  description: string | null;
  status: "PUBLISHED" | "DRAFT";
  driveFolderId: string | null;
  images: GalleryImage[];
}

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

export default function GalleryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [collection, setCollection] = useState<GalleryCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Edit form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [driveFolderId, setDriveFolderId] = useState("");

  // Add image form
  const [showAddImage, setShowAddImage] = useState(false);
  const [newMediaAssetId, setNewMediaAssetId] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  const fetchCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery/${id}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      const data: GalleryCollection = await res.json();
      setCollection(data);
      setTitle(data.title);
      setSlug(data.slug);
      setDescription(data.description || "");
      setStatus(data.status);
      setDriveFolderId(data.driveFolderId || "");
    } catch {
      setToast("Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          status,
          driveFolderId: driveFolderId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setToast("Collection saved");
      fetchCollection();
    } catch {
      setToast("Failed to save collection");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddImage(e: React.FormEvent) {
    e.preventDefault();
    setAddingImage(true);
    try {
      const res = await fetch(`/api/admin/gallery/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaAssetId: newMediaAssetId,
          alt: newAlt || null,
          caption: newCaption || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add image");
      setToast("Image added");
      setShowAddImage(false);
      setNewMediaAssetId("");
      setNewAlt("");
      setNewCaption("");
      fetchCollection();
    } catch {
      setToast("Failed to add image");
    } finally {
      setAddingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("Delete this image from the collection?")) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}/images/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete image");
      setToast("Image deleted");
      fetchCollection();
    } catch {
      setToast("Failed to delete image");
    }
  }

  async function handleReorder(imageId: string, direction: "up" | "down") {
    if (!collection) return;
    const images = [...collection.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = images.findIndex((img) => img.id === imageId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === images.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [images[idx], images[swapIdx]] = [images[swapIdx], images[idx]];

    const orderedIds = images.map((img) => img.id);

    try {
      const res = await fetch(`/api/admin/gallery/${id}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      setToast("Order updated");
      fetchCollection();
    } catch {
      setToast("Failed to reorder images");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading collection...</div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Collection not found.</p>
        <Link href="/admin/gallery" className="text-blue-600 hover:underline text-sm">
          Back to Gallery
        </Link>
      </div>
    );
  }

  const sortedImages = [...collection.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/gallery"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        &larr; Back to Gallery
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Collection</h1>

      {/* Collection meta editor */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive Folder ID</label>
              <input
                type="text"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Images section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Images ({sortedImages.length})
        </h2>
        <button
          onClick={() => setShowAddImage(!showAddImage)}
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          {showAddImage ? "Cancel" : "Add Image"}
        </button>
      </div>

      {/* Add image form */}
      {showAddImage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Image</h3>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Asset ID</label>
                <input
                  type="text"
                  value={newMediaAssetId}
                  onChange={(e) => setNewMediaAssetId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingImage}
                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addingImage ? "Adding..." : "Add Image"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Images grid */}
      {sortedImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          No images in this collection yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedImages.map((img, idx) => (
            <div key={img.id} className="bg-white rounded-lg shadow overflow-hidden group">
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 relative">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.alt || "Gallery image"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${img.url ? "hidden" : ""}`}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                {img.alt && (
                  <p className="text-xs text-gray-600 truncate mb-1">{img.alt}</p>
                )}
                {img.caption && (
                  <p className="text-xs text-gray-400 truncate">{img.caption}</p>
                )}

                {/* Controls */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReorder(img.id, "up")}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 4l4 5H4z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleReorder(img.id, "down")}
                      disabled={idx === sortedImages.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 12l4-5H4z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
