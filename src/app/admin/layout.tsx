"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Pages", href: "/admin/pages", icon: "☰" },
  { label: "Navigation", href: "/admin/navigation", icon: "≡" },
  { label: "Footer", href: "/admin/footer", icon: "⬓" },
  { label: "Members", href: "/admin/members", icon: "⚇" },
  { label: "Gallery", href: "/admin/gallery", icon: "▣" },
  { label: "Media", href: "/admin/media", icon: "⏤" },
  { label: "Theme", href: "/admin/theme", icon: "✫" },
  { label: "Events", href: "/admin/events", icon: "☷" },
  { label: "Articles", href: "/admin/articles", icon: "⬚" },
  { label: "Messages", href: "/admin/messages", icon: "✉" },
  { label: "Subscribers", href: "/admin/subscribers", icon: "🔔" },
  { label: "Volunteers", href: "/admin/volunteers", icon: "❤" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on the login page, render children without the admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // proceed to redirect even if the request fails
    }
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <span className="text-lg font-bold tracking-wide">LORA Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded text-sm font-medium
                transition-colors duration-150
                ${
                  isActive(item.href)
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
              aria-label="Open sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">LORA Admin</h1>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
