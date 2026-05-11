import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageBySlug, getPagesForAdmin } from "@/lib/cms-data";
import { requireAdmin } from "@/lib/admin-auth";

export default async function SiteBuilderPage() {
  await requireAdmin();
  const [pages, home] = await Promise.all([getPagesForAdmin(), getPageBySlug("en", "home")]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Site Builder</p>
          <h1 className="mt-3 text-4xl font-medium">Pages and sections</h1>
        </div>
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Page manager</CardTitle>
            <Button variant="admin" size="sm">
              New page
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pages.map((page) => (
              <div key={page.id} className="rounded-md border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg">{page.title}</p>
                    <p className="mt-1 text-sm text-white/45">
                      /{page.locale}/{page.slug === "home" ? "" : page.slug}
                    </p>
                  </div>
                  <Badge className="border-white/15 text-white/55">{page.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-white/45">
                  <span>{page.sections} sections</span>
                  <Link href={`/${page.locale}/${page.slug === "home" ? "" : page.slug}`} className="text-white">
                    Preview
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Live preview panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-white/10 bg-[var(--color-soft-white)] text-black">
              <div className="border-b border-black/10 px-4 py-3 text-xs uppercase tracking-[0.16em] text-black/45">
                /en
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-heritage-green)]">
                  {home?.sections[0]?.type} / {home?.sections[0]?.variant}
                </p>
                <h2 className="mt-4 text-5xl font-[var(--font-heading-weight)]">{home?.title}</h2>
                <p className="mt-4 max-w-xl text-black/60">{home?.seoDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Section builder controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-white/62">
            <p>Create, delete, reorder, hide/show, change section type, select variants, assign media, control spacing, background, alignment, and animation presets.</p>
            <p>Drag/drop is wired at the UI layer with API support through /api/admin/sections/reorder.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
