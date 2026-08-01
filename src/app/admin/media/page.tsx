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

interface Crumb {
  id: string | null;
  name: string;
}

const DRIVE_ROOT_URL =
  "https://drive.google.com/drive/folders/1JPsc0Lp5TbxU6AoO093NVgyJYaYVmK6v";

export default function MediaPage() {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: null, name: "Drive" }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<DriveFile | null>(null);

  const currentFolderId = crumbs[crumbs.length - 1]?.id ?? null;

  const load = useCallback(async (folderId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const fq = folderId ? `?parentId=${encodeURIComponent(folderId)}` : "";
      const iq = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
      const [fRes, iRes] = await Promise.all([
        fetch(`/api/admin/drive/folders${fq}`),
        fetch(`/api/admin/drive/images${iq}`),
      ]);
      if (!fRes.ok || !iRes.ok) throw new Error("Drive request failed");
      const fData = await fRes.json();
      const iData = await iRes.json();
      setFolders(Array.isArray(fData) ? fData : []);
      setFiles(Array.isArray(iData?.files) ? iData.files : []);
    } catch {
      setError(
        "Could not reach Google Drive. Check that the Drive credentials are configured.",
      );
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentFolderId);
  }, [currentFolderId, load]);

  function openFolder(folder: DriveFolder) {
    setCrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function goToCrumb(index: number) {
    setCrumbs((prev) => prev.slice(0, index + 1));
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function copyUrl(file: DriveFile) {
    const url = `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Image URL copied - paste it anywhere an image is needed");
    } catch {
      showToast(url);
    }
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm text-white bg-green-600 max-w-md break-all">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Media - Google Drive</h1>
        <a
          href={DRIVE_ROOT_URL}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          Open Drive folder
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        All site images live in the shared Google Drive folder. To add or remove
        images, upload or delete them in Drive - the website reads directly from
        it. Use &quot;Copy URL&quot; to reference an image in members, pages, or
        sections.
      </p>

      <div className="flex items-center gap-1 mb-4 text-sm">
        {crumbs.map((c, i) => (
          <span key={`${c.id}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-400">/</span>}
            <button
              onClick={() => goToCrumb(i)}
              className={
                i === crumbs.length - 1
                  ? "font-semibold text-gray-900"
                  : "text-blue-600 hover:underline"
              }
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500">
          Loading from Google Drive...
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-4">{error}</div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openFolder(f)}
                  className="bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl mb-1">&#128193;</div>
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {f.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {files.length === 0 && folders.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              This folder is empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg shadow overflow-hidden group"
                >
                  <button
                    onClick={() => setPreview(file)}
                    className="block w-full aspect-square bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w400`}
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
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
          )}
        </>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://drive.google.com/thumbnail?id=${preview.id}&sz=w2000`}
              alt={preview.name}
              className="w-full max-h-[70vh] object-contain bg-gray-50"
            />
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-gray-800 truncate">
                {preview.name}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => copyUrl(preview)}
                  className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
