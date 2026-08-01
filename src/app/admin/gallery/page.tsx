"use client";

import { useCallback, useEffect, useState } from "react";

interface DriveFolder {
  id: string;
  name: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string;
}

const DRIVE_ROOT_URL =
  "https://drive.google.com/drive/folders/1JPsc0Lp5TbxU6AoO093NVgyJYaYVmK6v";

// Which Drive folders power which public page
const GALLERY_FOLDER_NAMES = ["historical pics", "landmarks", "famous"];
const ARCHIVE_FOLDER_NAMES = ["neighborhood archive"];

function norm(name: string) {
  return name.toLowerCase().trim();
}

export default function GalleryPage() {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [open, setOpen] = useState<DriveFolder | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/drive/folders");
        if (!res.ok) throw new Error("drive");
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not reach Google Drive.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openFolder = useCallback(async (folder: DriveFolder) => {
    setOpen(folder);
    setLoadingFiles(true);
    setFiles([]);
    try {
      const res = await fetch(
        `/api/admin/drive/images?folderId=${encodeURIComponent(folder.id)}`,
      );
      const data = await res.json();
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch {
      setToast("Failed to load folder images");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  async function copyUrl(file: DriveFile) {
    const url = `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Image URL copied");
    } catch {
      setToast(url);
    }
    setTimeout(() => setToast(null), 2500);
  }

  const galleryFolders = folders.filter((f) =>
    GALLERY_FOLDER_NAMES.includes(norm(f.name)),
  );
  const archiveFolders = folders.filter((f) =>
    ARCHIVE_FOLDER_NAMES.includes(norm(f.name)),
  );

  function FolderGrid({ items }: { items: DriveFolder[] }) {
    if (items.length === 0)
      return <p className="text-sm text-gray-400">Folder not found in Drive.</p>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((f) => (
          <button
            key={f.id}
            onClick={() => openFolder(f)}
            className={`rounded-lg shadow p-4 text-left transition-shadow hover:shadow-md ${
              open?.id === f.id ? "bg-blue-50 ring-2 ring-blue-400" : "bg-white"
            }`}
          >
            <div className="text-2xl mb-1">&#128193;</div>
            <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">Click to view images</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm text-white bg-green-600 max-w-md break-all">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Gallery &amp; Archive</h1>
        <a
          href={DRIVE_ROOT_URL}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          Manage in Google Drive
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        The public Photo Gallery and Neighborhood Archive read directly from
        Google Drive. Add or delete images in the folders below (in Drive) and
        the website updates automatically — nothing to publish here.
      </p>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Loading from Google Drive...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-4">{error}</div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Photo Gallery folders
          </h2>
          <div className="mb-8">
            <FolderGrid items={galleryFolders} />
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Neighborhood Archive folder
          </h2>
          <div className="mb-8">
            <FolderGrid items={archiveFolders} />
          </div>

          {open && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {open.name} — {loadingFiles ? "loading..." : `${files.length} images`}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {files.map((file) => (
                  <div key={file.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="w-full aspect-square bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w400`}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-gray-700 truncate" title={file.name}>
                        {file.name}
                      </div>
                      <button
                        onClick={() => copyUrl(file)}
                        className="mt-1 w-full px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
