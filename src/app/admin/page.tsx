import { Archive, ExternalLink, FileText, FolderSync, GalleryHorizontalEnd, Images, UserRoundCog, Users } from "lucide-react";

import { AdminSystemTestPanel } from "@/components/admin/admin-system-test-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGalleryCollections, getMembers, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

const contentWorkflows = [
  {
    title: "Who We Are",
    description: "Merged page for Who We Are, What We Do, and Founding Members.",
    adminHref: "/admin/who-we-are",
    liveHref: "/en/who-we-are",
    icon: FileText,
  },
  {
    title: "Photo Gallery",
    description: "Public gallery categories. Images come from synced Google Drive folders.",
    adminHref: "/admin/media",
    liveHref: "/en/photo-gallery",
    icon: Images,
  },
  {
    title: "Neighborhood Archive",
    description: "Pictures, videos, labels, and text from the Drive archive folder.",
    adminHref: "/admin/media?folder=neighborhood-archive",
    liveHref: "/en/neighborhood-archive",
    icon: Archive,
  },
  {
    title: "Join Us",
    description: "Membership form and application endpoint.",
    adminHref: "/admin/pages",
    liveHref: "/en/join-us",
    icon: UserRoundCog,
  },
];

const mediaWorkflows = [
  { title: "Sync all Drive folders", href: "/admin/media", description: "Refresh Google Drive folders into website categories.", icon: FolderSync },
  { title: "Historical Pics", href: "/admin/media?folder=historical-photos", description: "Edit historical gallery labels and captions.", icon: Images },
  { title: "Landmarks", href: "/admin/media?folder=landmarks", description: "Edit landmark gallery labels and captions.", icon: GalleryHorizontalEnd },
  { title: "Famous Figures", href: "/admin/media?folder=famous-figures", description: "Edit famous figure cards.", icon: Users },
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [pages, members, collections] = await Promise.all([
    getPagesForAdmin(),
    getMembers("en"),
    getGalleryCollections("en"),
  ]);
  const publicImages = collections.reduce((count, collection) => count + collection.images.length, 0);

  return (
    <div className="grid gap-7">
      <section className="grid gap-5 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">L.O.R.A Admin</p>
            <h1 className="mt-3 text-4xl font-medium text-black md:text-5xl">Website control room</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-black/58">
              Edit the public website from one place. Page text is stored in the CMS database. Images and videos must come from Google Drive.
            </p>
          </div>
          <a
            href="/en/who-we-are"
            target="_blank"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-heritage-green)] px-5 text-sm font-medium text-[var(--color-heritage-green)] transition-colors hover:bg-[var(--color-heritage-green)] hover:text-white"
          >
            <ExternalLink size={16} />
            Open live site
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="CMS pages" value={pages.length} />
          <Stat label="Drive categories" value={collections.length} />
          <Stat label="Public images" value={publicImages} />
          <Stat label="Founding members" value={members.length} />
        </div>
      </section>

      <AdminSystemTestPanel />

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-medium text-black">Live website sections</h2>
          <p className="mt-1 text-sm text-black/55">Each card has an admin editor and the matching public page.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contentWorkflows.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-black/10 bg-white text-black shadow-sm">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-heritage-green)] text-white">
                    <Icon size={18} />
                  </div>
                  <CardTitle className="pt-2">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <a className="text-sm font-medium text-[var(--color-heritage-green)]" href={item.adminHref}>
                    Edit
                  </a>
                  <a className="text-sm text-black/58 underline underline-offset-4" href={item.liveHref} target="_blank">
                    View live
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-medium text-black">Google Drive media</h2>
          <p className="mt-1 text-sm text-black/55">Use these panels for image and video content. Local-only media is not the source of truth.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mediaWorkflows.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-black/10 bg-white text-black shadow-sm">
                <a href={item.href} className="block">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white">
                      <Icon size={18} />
                    </div>
                    <CardTitle className="pt-2">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </a>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-black/10 bg-[var(--color-soft-white)] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-black/42">{label}</p>
      <p className="mt-2 text-3xl font-medium text-black">{value}</p>
    </div>
  );
}
