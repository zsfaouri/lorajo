"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Images,
  ContactRound,
  FileText,
  FolderPlus,
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

const navGroups = [
  {
    title: "Dashboard",
    items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Content",
    items: [
      { label: "Create New Page", href: "/admin/pages", icon: FileText },
      { label: "Who We Are", href: "/admin/who-we-are", icon: ContactRound },
      { label: "What We Do", href: "/admin/what-we-do", icon: Library },
      { label: "Events", href: "/admin/events", icon: CalendarDays },
      { label: "Announcements", href: "/admin/announcements", icon: FileText },
      { label: "Projects", href: "/admin/projects", icon: GalleryHorizontalEnd },
      { label: "Page Builder", href: "/admin/site-builder", icon: PanelTop },
    ],
  },
  {
    title: "Media",
    items: [
      { label: "Image Cloud", href: "/admin/media", icon: FolderPlus },
      { label: "Hero Gallery", href: "/admin/hero-pics", icon: Images },
      { label: "Famous Figures", href: "/admin/media?folder=famous-figures", icon: Users, folder: "famous-figures" },
      { label: "Landmarks", href: "/admin/media?folder=landmarks", icon: GalleryHorizontalEnd, folder: "landmarks" },
      { label: "Historical Pics", href: "/admin/media?folder=historical-photos", icon: Images, folder: "historical-photos" },
    ],
  },
  {
    title: "People",
    items: [{ label: "Founding Members", href: "/admin/members", icon: Users }],
  },
  {
    title: "Website Setup",
    items: [
      { label: "Navigation", href: "/admin/navigation", icon: Navigation },
      { label: "Footer", href: "/admin/footer", icon: ScrollText },
      { label: "Theme", href: "/admin/theme", icon: Palette },
      { label: "Admin Control", href: "/admin/control", icon: ShieldCheck },
    ],
  },
  {
    title: "Inbox",
    items: [
      { label: "Messages", href: "/admin/messages", icon: Inbox },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
      { label: "Volunteers", href: "/admin/volunteers", icon: Users },
    ],
  },
];

const nav = navGroups.flatMap((group) => group.items);

export function AdminShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFolder = searchParams.get("folder") ?? "";

  function isActive(item: (typeof nav)[number]) {
    const hrefPath = item.href.split("?")[0];
    if ("folder" in item && item.folder) return pathname === "/admin/media" && activeFolder === item.folder;
    if (hrefPath === "/admin/media") return pathname === "/admin/media" && !activeFolder;
    return pathname === hrefPath || (hrefPath !== "/admin" && pathname.startsWith(`${hrefPath}/`));
  }

  return (
    <div className="admin-theme min-h-screen bg-[var(--color-soft-white)] text-[var(--color-black)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-y-auto border-r border-black/10 bg-[var(--color-soft-white)] p-5 lg:block">
        <Link href="/admin" className="flex items-center gap-3 border-b border-black/10 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-heritage-green)]/20 bg-white shadow-sm">
            <Image src="/lora/brand/lora-logo.png" alt="LORA logo" width={44} height={44} className="h-11 w-11 rounded-full object-contain" priority />
          </span>
          <span>
            <span className="block text-2xl font-semibold leading-none">LORA</span>
            <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-black/45">Luweibdeh admin</span>
          </span>
        </Link>
        <nav className="mt-5 grid gap-5 pb-6">
          {navGroups.map((group) => (
            <section key={group.title} className="grid gap-1">
              <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-black/36">{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
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
            </section>
          ))}
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
            const active = isActive(item);
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
