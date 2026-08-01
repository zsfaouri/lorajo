"use client";

import { useEffect, useState, useCallback } from "react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  locale: string | null;
  consent: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const data = await res.json();
      setSubscribers(data);
    } catch {
      setToast("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filtered = search
    ? subscribers.filter((s) =>
        s.email.toLowerCase().includes(search.toLowerCase())
      )
    : subscribers;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Newsletter Subscribers
        </h1>
        {!loading && (
          <span className="text-sm text-gray-500">
            {subscribers.length} total subscriber{subscribers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading subscribers...
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {search ? "No subscribers match your search." : "No subscribers yet."}
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Locale
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Consent
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900">{sub.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {sub.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sub.locale || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.consent
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sub.consent ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(sub.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
