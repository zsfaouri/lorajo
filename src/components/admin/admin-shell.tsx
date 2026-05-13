"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Images,
  ContactRound,
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
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Create New Page", href: "/admin/pages", icon: FileText },
  { label: "Hero Pics", href: "/admin/hero-pics", icon: Images },
  { label: "Who We Are", href: "/admin/who-we-are", icon: ContactRound },
  { label: "Image Cloud", href: "/admin/media", icon: Library },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Announcements", href: "/admin/announcements", icon: FileText },
  { label: "Founding Members", href: "/admin/members", icon: Users },
  { label: "Admin Control", href: "/admin/control", icon: ShieldCheck },
  { label: "Page Builder", href: "/admin/site-builder", icon: PanelTop },
  { label: "Theme", href: "/admin/theme", icon: Palette },
  { label: "Navigation", href: "/admin/navigation", icon: Navigation },
  { label: "Footer", href: "/admin/footer", icon: ScrollText },
  { label: "Projects", href: "/admin/projects", icon: GalleryHorizontalEnd },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Messages", href: "/admin/messages", icon: Inbox },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Volunteers", href: "/admin/volunteers", icon: Users },
];

export function AdminShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();

  return (
    <div className="admin-theme min-h-screen bg-[var(--color-soft-white)] text-[var(--color-black)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-black/10 bg-[var(--color-soft-white)] p-5 lg:block">
        <Link href="/admin" className="flex items-center gap-3 border-b border-black/10 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-heritage-green)]/20 bg-white shadow-sm">
            <Image src="/lora/brand/lora-logo.png" alt="LORA logo" width={44} height={44} className="h-11 w-11 rounded-full object-contain" priority />
          </span>
          <span>
            <span className="block text-2xl font-semibold leading-none">LORA</span>
            <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-black/45">Luweibdeh admin</span>
          </span>
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--color-heritage-green)]/8 hover:text-[var(--color-heritage-green)]",
                  active ? "admin-active bg-[var(--color-heritage-green)] text-white" : "text-black/62",
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/10 bg-[var(--color-soft-white)]/86 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Image src="/lora/brand/lora-logo.png" alt="LORA logo" width={32} height={32} className="h-8 w-8 rounded-full object-contain lg:hidden" />
            <p className="text-sm uppercase tracking-[0.16em] text-black/45">LORA admin panel</p>
          </div>
          <Link href="/en" className="rounded-full border border-[var(--color-heritage-green)] px-4 py-2 text-sm text-[var(--color-heritage-green)] transition-colors hover:bg-[var(--color-heritage-green)] hover:text-white">
            View site
          </Link>
        </header>
        <nav className="sticky top-16 z-20 flex gap-2 overflow-x-auto border-b border-black/10 bg-[var(--color-soft-white)] px-4 py-3 lg:hidden">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.12em]",
                  active ? "admin-active border-[var(--color-heritage-green)] bg-[var(--color-heritage-green)] text-white" : "border-black/10 text-black/58",
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
