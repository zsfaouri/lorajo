"use client";

import { useEffect, useState } from "react";

interface DashboardCounts {
  pages: number | null;
  members: number | null;
  unreadMessages: number | null;
  collections: number | null;
  events: number | null;
  articles: number | null;
  subscribers: number | null;
  volunteers: number | null;
}

const cards = [
  { key: "pages", label: "Pages", icon: "📄" },
  { key: "members", label: "Members", icon: "👥" },
  { key: "unreadMessages", label: "Unread Messages", icon: "✉️" },
  { key: "collections", label: "Collections", icon: "🖼️" },
  { key: "events", label: "Events", icon: "📅" },
  { key: "articles", label: "Articles", icon: "📰" },
  { key: "subscribers", label: "Subscribers", icon: "📬" },
  { key: "volunteers", label: "Volunteers", icon: "🤝" },
] as const;

async function fetchCount(url: string, countFn?: (data: any[]) => number): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const data = await res.json();
  return countFn ? countFn(data) : data.length;
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    pages: null,
    members: null,
    unreadMessages: null,
    collections: null,
    events: null,
    articles: null,
    subscribers: null,
    volunteers: null,
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetches: { key: keyof DashboardCounts; url: string; countFn?: (data: any[]) => number }[] = [
      { key: "pages", url: "/api/admin/pages" },
      { key: "members", url: "/api/admin/members" },
      {
        key: "unreadMessages",
        url: "/api/admin/messages",
        countFn: (data) => data.filter((m: any) => m.status === "NEW").length,
      },
      { key: "collections", url: "/api/admin/gallery" },
      { key: "events", url: "/api/admin/events" },
      { key: "articles", url: "/api/admin/articles" },
      { key: "subscribers", url: "/api/admin/subscribers" },
      { key: "volunteers", url: "/api/admin/volunteers" },
    ];

    const newCounts: Partial<DashboardCounts> = {};
    const newErrors: Record<string, boolean> = {};

    Promise.allSettled(
      fetches.map(async ({ key, url, countFn }) => {
        try {
          const count = await fetchCount(url, countFn);
          newCounts[key] = count;
        } catch {
          newErrors[key] = true;
        }
      })
    ).then(() => {
      setCounts((prev) => ({ ...prev, ...newCounts }));
      setErrors(newErrors);
      setLoading(false);
    });
  }, []);

  function renderValue(key: keyof DashboardCounts) {
    if (loading) return "...";
    if (errors[key]) return "?";
    return counts[key] ?? "?";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ key, label, icon }) => (
          <div key={key} className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-3xl font-bold">{renderValue(key)}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
