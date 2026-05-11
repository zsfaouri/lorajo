import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGalleryCollections, getMembers, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [pages, members, collections] = await Promise.all([
    getPagesForAdmin(),
    getMembers("en"),
    getGalleryCollections("en"),
  ]);

  const stats = [
    { label: "Pages", value: pages.length, href: "/admin/site-builder" },
    { label: "Founding members", value: members.length, href: "/admin/members" },
    { label: "Gallery collections", value: collections.length, href: "/admin/gallery" },
    { label: "Publish states", value: "Draft / Live", href: "/admin/site-builder" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Dashboard</p>
        <h1 className="mt-3 text-4xl font-medium">CMS control center</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/[0.07]">
              <CardHeader>
                <CardDescription className="text-white/45">{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Foundation status</CardTitle>
          <CardDescription className="text-white/45">Backend-controlled rendering surface.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-white/65 md:grid-cols-2">
          <p>Pages, sections, theme tokens, navigation, footer, members, gallery, messages, subscribers, and applications are modeled in Prisma.</p>
          <p>Public pages render through DynamicPage, SectionRenderer, variant components, and active theme tokens.</p>
        </CardContent>
      </Card>
    </div>
  );
}
