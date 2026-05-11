"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FileText,
  GalleryHorizontalEnd,
  Inbox,
  LayoutDashboard,
  Library,
  Mail,
  Navigation,
  Palette,
  PanelTop,
  ScrollText,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Site Builder", href: "/admin/site-builder", icon: PanelTop },
  { label: "Theme Studio", href: "/admin/theme", icon: Palette },
  { label: "Media Library", href: "/admin/media", icon: Library },
  { label: "Pages", href: "/admin/pages", icon: FileText },
  { label: "Navigation", href: "/admin/navigation", icon: Navigation },
  { label: "Footer", href: "/admin/footer", icon: ScrollText },
  { label: "Projects", href: "/admin/projects", icon: GalleryHorizontalEnd },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Announcements", href: "/admin/announcements", icon: FileText },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Gallery", href: "/admin/gallery", icon: GalleryHorizontalEnd },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Messages", href: "/admin/messages", icon: Inbox },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Volunteers", href: "/admin/volunteers", icon: Users },
];

export function AdminShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-[#0d0d0d] p-5 lg:block">
        <Link href="/admin" className="block border-b border-white/10 pb-5">
          <p className="text-2xl font-medium">LORA CMS</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">Backend control surface</p>
        </Link>
        <nav className="mt-5 grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/8 hover:text-white",
                  active ? "bg-white/10 text-white" : "text-white/62",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#080808]/82 px-5 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.16em] text-white/45">Draft / Publish CMS</p>
          <Link href="/en" className="text-sm text-white/70 hover:text-white">
            View site
          </Link>
        </header>
        <nav className="sticky top-16 z-20 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#0b0b0b] px-4 py-3 lg:hidden">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.12em]",
                  active ? "border-white bg-white text-black" : "border-white/10 text-white/58",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className={cn("p-5 md:p-8", className)}>{children}</main>
      </div>
    </div>
  );
}
