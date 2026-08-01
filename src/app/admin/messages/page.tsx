"use client";

import { Fragment, useEffect, useState, useCallback } from "react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "NEW" | "READ" | "ARCHIVED";
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "ALL" | "NEW" | "READ" | "ARCHIVED";

const STATUS_TABS: StatusFilter[] = ["ALL", "NEW", "READ", "ARCHIVED"];

function statusBadge(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800";
    case "READ":
      return "bg-gray-100 text-gray-800";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-800";
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

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch {
      setToast("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filtered =
    activeTab === "ALL"
      ? messages
      : messages.filter((m) => m.status === activeTab);

  const unreadCount = messages.filter((m) => m.status === "NEW").length;

  async function handleUpdateStatus(id: string, status: "READ" | "ARCHIVED") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update message");
      setToast(`Message marked as ${status.toLowerCase()}`);
      fetchMessages();
    } catch {
      setToast("Failed to update message");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete message");
      setToast("Message deleted");
      setExpandedId(null);
      fetchMessages();
    } catch {
      setToast("Failed to delete message");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "ALL" ? "All" : tab}
            {tab === "NEW" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading messages...
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No messages found.
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
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
                  Subject
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
              {filtered.map((msg) => (
                <Fragment key={msg.id}>
                  <tr
                    onClick={() =>
                      setExpandedId(expandedId === msg.id ? null : msg.id)
                    }
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      msg.status === "NEW" ? "font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900">{msg.name}</td>
                    <td className="px-4 py-3 text-gray-600">{msg.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {msg.subject || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(msg.status)}`}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(msg.createdAt)}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === msg.id && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-4 py-4">
                        <div className="max-w-2xl">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap mb-4">
                            {msg.message}
                          </p>
                          <div className="flex gap-2">
                            {msg.status !== "READ" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(msg.id, "READ");
                                }}
                                disabled={actionLoading === msg.id}
                                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Mark as Read
                              </button>
                            )}
                            {msg.status !== "ARCHIVED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(msg.id, "ARCHIVED");
                                }}
                                disabled={actionLoading === msg.id}
                                className="px-4 py-2 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                              >
                                Archive
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(msg.id);
                              }}
                              disabled={actionLoading === msg.id}
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
