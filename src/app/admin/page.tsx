import Link from "next/link";
import { CalendarDays, FileText, GalleryHorizontalEnd, Images, ShieldCheck, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGalleryCollections, getMembers, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

const workflows = [
  {
    title: "Create New Page",
    description: "Add text, images, events, announcements, and reusable sections.",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    title: "Who We Are",
    description: "Control the public text, pictures, and sections for the Who We Are page.",
    href: "/admin/who-we-are",
    icon: Users,
  },
  {
    title: "Photo Gallery",
    description: "Create albums, choose an album, upload images, edit text, and remove items.",
    href: "/admin/gallery",
    icon: GalleryHorizontalEnd,
  },
  {
    title: "Media Cloud",
    description: "Bulk upload images once, sort them into categories, and reuse them anywhere.",
    href: "/admin/media",
    icon: Images,
  },
  {
    title: "Events and Announcements",
    description: "Create public updates with dates, images, locations, and action links.",
    href: "/admin/events",
    icon: CalendarDays,
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
    { label: "Gallery albums", value: collections.length },
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
            <Link key={item.title} href={item.href}>
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
            </Link>
          );
        })}
      </section>
    </div>
  );
}
