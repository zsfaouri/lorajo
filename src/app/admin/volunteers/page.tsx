"use client";

import { Fragment, useEffect, useState, useCallback } from "react";

interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interests: string[] | string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderInterests(interests: string[] | string) {
  if (Array.isArray(interests)) {
    return interests.join(", ");
  }
  if (typeof interests === "string") {
    return interests;
  }
  return "—";
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

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/volunteers");
      if (!res.ok) throw new Error("Failed to fetch volunteers");
      const data = await res.json();
      setVolunteers(data);
    } catch {
      setToast("Failed to load volunteer applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  async function handleUpdateStatus(id: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update application");
      setToast(`Application ${status.toLowerCase()}`);
      fetchVolunteers();
    } catch {
      setToast("Failed to update application");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete application");
      setToast("Application deleted");
      setExpandedId(null);
      fetchVolunteers();
    } catch {
      setToast("Failed to delete application");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Volunteer Applications
      </h1>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading applications...
        </div>
      )}

      {/* Empty state */}
      {!loading && volunteers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No volunteer applications yet.
        </div>
      )}

      {/* Table */}
      {!loading && volunteers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((vol) => (
                <Fragment key={vol.id}>
                  <tr
                    onClick={() =>
                      setExpandedId(expandedId === vol.id ? null : vol.id)
                    }
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900">{vol.name}</td>
                    <td className="px-4 py-3 text-gray-600">{vol.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(vol.status)}`}
                      >
                        {vol.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(vol.createdAt)}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === vol.id && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50 px-4 py-4">
                        <div className="max-w-2xl space-y-3">
                          <div>
                            <span className="block text-sm font-medium text-gray-700 mb-1">
                              Interests
                            </span>
                            <p className="text-sm text-gray-800">
                              {renderInterests(vol.interests)}
                            </p>
                          </div>
                          {vol.message && (
                            <div>
                              <span className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                              </span>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {vol.message}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            {vol.status !== "APPROVED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(vol.id, "APPROVED");
                                }}
                                disabled={actionLoading === vol.id}
                                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {vol.status !== "REJECTED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(vol.id, "REJECTED");
                                }}
                                disabled={actionLoading === vol.id}
                                className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(vol.id);
                              }}
                              disabled={actionLoading === vol.id}
                              className="px-4 py-2 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
