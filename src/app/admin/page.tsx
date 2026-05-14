import { Archive, CalendarDays, ContactRound, FileText, FolderPlus, GalleryHorizontalEnd, Images, Landmark, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGalleryCollections, getMembers, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

const publishWorkflows = [
  {
    title: "Create New Page",
    description: "Create pages, edit existing pages, add text, photos, videos, forms, events, and announcement sections.",
    href: "/admin/pages",
    icon: FileText,
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
    title: "Founding Members",
    description: "Create and edit founding member profiles and portraits.",
    href: "/admin/members",
    icon: Users,
  },
];

const mediaWorkflows = [
  {
    title: "Image Cloud",
    description: "Sync and manage Google Drive image folders.",
    href: "/admin/media",
    icon: FolderPlus,
  },
  {
    title: "Famous Figures",
    description: "Edit profile images and captions shown in the Famous Figures gallery.",
    href: "/admin/media?folder=famous-figures",
    icon: Users,
  },
  {
    title: "Landmarks",
    description: "Edit landmark photos and text from the Drive folder.",
    href: "/admin/media?folder=landmarks",
    icon: Landmark,
  },
  {
    title: "Historical Pics",
    description: "Edit historical photo entries from the Drive folder.",
    href: "/admin/media?folder=historical-photos",
    icon: Images,
  },
  {
    title: "Neighborhood Archive",
    description: "Edit the archive page. Use the media link for archive images and videos.",
    href: "/admin/neighborhood-archive",
    icon: Archive,
    secondaryHref: "/admin/media?folder=neighborhood-archive",
    secondaryLabel: "Edit media",
  },
  {
    title: "Hero Gallery",
    description: "Edit hero images separately from the public photo gallery.",
    href: "/admin/hero-pics",
    icon: Images,
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

      <WorkflowGroup title="Publish content" items={publishWorkflows} />
      <WorkflowGroup title="Manage media" items={mediaWorkflows} />
    </div>
  );
}

function WorkflowGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{
    title: string;
    description: string;
    href: string;
    icon: typeof FileText;
    secondaryHref?: string;
    secondaryLabel?: string;
  }>;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-medium text-black">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="h-full border-black/10 bg-white/70 text-black shadow-sm transition-colors hover:border-[var(--color-heritage-green)]/35 hover:bg-white">
              <a href={item.href} className="block">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-heritage-green)] text-white">
                    <Icon size={18} />
                  </div>
                  <CardTitle className="pt-2">{item.title}</CardTitle>
                  <CardDescription className="text-black/55">{item.description}</CardDescription>
                </CardHeader>
              </a>
              <CardContent className="flex flex-wrap gap-3">
                <a href={item.href} className="text-sm text-[var(--color-heritage-green)]">
                  Open
                </a>
                {item.secondaryHref ? (
                  <a href={item.secondaryHref} className="text-sm text-black/60 underline underline-offset-4">
                    {item.secondaryLabel}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
