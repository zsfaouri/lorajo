import { CalendarDays, ContactRound, FileText, FolderPlus, GalleryHorizontalEnd, Images, ShieldCheck, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGalleryCollections, getMembers, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

const workflows = [
  {
    title: "Create New Page",
    description: "Create pages, edit existing pages, add text, photos, videos, forms, events, and announcement sections.",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    title: "Image Cloud",
    description: "Google Drive folders power website image folders. Famous Figures, Founding Members, Landmarks, and Historical Pics stay here.",
    href: "/admin/media",
    icon: FolderPlus,
  },
  {
    title: "Hero Gallery",
    description: "Edit hero images separately from the public photo gallery.",
    href: "/admin/hero-pics",
    icon: Images,
  },
  {
    title: "Famous Figures",
    description: "Open the Famous Figures Drive folder tab and edit image text shown on the website.",
    href: "/admin/media?folder=famous-figures",
    icon: Users,
  },
  {
    title: "Who We Are",
    description: "Open the Who We Are page editor. Edit text, media, sections, forms, and layout.",
    href: "/admin/who-we-are",
    icon: ContactRound,
  },
  {
    title: "What We Do",
    description: "Open the What We Do page editor. Edit images, copy, videos, and page sections.",
    href: "/admin/what-we-do",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Events",
    description: "Create events with title, date, Drive image, video, invitation link, location, and details.",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    title: "Announcements",
    description: "Create announcements that can be surfaced on pages.",
    href: "/admin/announcements",
    icon: FileText,
  },
  {
    title: "Admin Control",
    description: "Change login email, password, social links, and user access permissions.",
    href: "/admin/control",
    icon: ShieldCheck,
  },
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [pages, members, collections] = await Promise.all([
    getPagesForAdmin(),
    getMembers("en"),
    getGalleryCollections("en"),
  ]);

  const stats = [
    { label: "Pages", value: pages.length },
    { label: "Founding members", value: members.length },
    { label: "Drive tabs", value: collections.length },
    { label: "Mode", value: "Draft / Live" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">Dashboard</p>
        <h1 className="mt-3 text-4xl font-medium">Admin workspace</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
          Use the panels below. Each panel maps to one public-site job.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-black/10 bg-white/70 text-black shadow-sm">
            <CardHeader>
              <CardDescription className="text-black/45">{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workflows.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.title} href={item.href}>
              <Card className="h-full border-black/10 bg-white/70 text-black shadow-sm transition-colors hover:border-[var(--color-heritage-green)]/35 hover:bg-white">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-heritage-green)] text-white">
                    <Icon size={18} />
                  </div>
                  <CardTitle className="pt-2">{item.title}</CardTitle>
                  <CardDescription className="text-black/55">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-[var(--color-heritage-green)]">Open</span>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </section>
    </div>
  );
}
