# LORA Website Project Documentation

Last updated: 2026-05-14

## Purpose

This repository contains the public website and CMS for LORA, the Luweibdeh Old Residents Association. It supports public bilingual content, admin-managed page sections, Drive-backed media, gallery collections, founding members, events, articles, newsletter capture, contact messages, and theme controls.

## Technology Overview

Runtime:

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL
- NextAuth

Media and integrations:

- Google Drive API and fallback embedded-folder parsing
- Cloudinary and Supabase variables are present for compatibility, but current admin media flows use Drive and database records
- Resend for contact/newsletter email flows when configured

Motion and UI:

- Framer Motion for section reveals and interactive galleries
- GSAP ScrollTrigger for the home cinematic scrub hero
- Lenis for smooth public scrolling
- Radix primitives and local UI components in `src/components/ui`
- Lucide icons

## Repository Layout

```text
src/app
  App Router pages, layouts, API routes, admin routes, public localized routes

src/components/admin
  Admin dashboard, editors, managers, image pickers, page section editor

src/components/cms
  CMS page rendering and section dispatch

src/components/layout
  Public/admin layout components, header, footer, smooth scroll provider

src/components/sections
  Public section renderers used by CMS pages

src/components/ui
  Shared UI primitives

src/lib
  CMS data loaders, Drive utilities, auth helpers, SEO helpers, fallback data, validation

src/types
  Shared CMS DTO and type definitions

prisma
  Database schema, migrations, seed script

scripts
  Utility scripts for standalone build assets and media import

docs
  Handover and project documentation
```

## Environment Variables

Required for a normal production-style environment:

```text
DATABASE_URL
AUTH_SECRET
AUTH_URL
NEXTAUTH_URL
ADMIN_EMAIL
ADMIN_PASSWORD
NEXT_PUBLIC_SITE_URL
```

Google Drive media sync:

```text
GOOGLE_DRIVE_CLIENT_EMAIL
GOOGLE_DRIVE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

Email:

```text
RESEND_API_KEY
CONTACT_TO_EMAIL
```

Optional or compatibility variables:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Use `.env.example` as the source template.

## Local Development

Install dependencies:

```powershell
pnpm.cmd install
```

Create `.env`:

```powershell
Copy-Item .env.example .env
```

Start local PostgreSQL if using the local `.postgres-data` setup:

```powershell
pnpm.cmd pg:start
```

Run migrations:

```powershell
pnpm.cmd prisma:migrate
```

Seed content:

```powershell
pnpm.cmd db:seed
```

Start dev server:

```powershell
pnpm.cmd dev
```

If port `3000` is taken, use a specific port:

```powershell
pnpm.cmd exec next dev --hostname 127.0.0.1 --port 3200
```

## Build and Verification

Standard verification:

```powershell
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit
pnpm.cmd build
```

Production start after build:

```powershell
pnpm.cmd start
```

The build script runs:

```text
prisma generate && next build && tsx scripts/copy-standalone-assets.ts
```

It does not run `prisma migrate deploy`. Run deployment migrations separately in the hosting environment.

## Database Model Summary

Core CMS:

- `Page`: localized public page metadata
- `PageSection`: ordered CMS sections for a page
- `SectionBlock`: optional nested section blocks
- `NavigationItem`: localized navigation
- `FooterColumn`: localized footer content
- `SiteTheme` and `DesignToken`: theme token storage

Public content:

- `Project`
- `Event`
- `Article`
- `Member`
- `GalleryCollection`
- `GalleryImage`
- `MediaAsset`

Inbound data:

- `ContactMessage`
- `NewsletterSubscriber`
- `VolunteerApplication`

Auth/admin:

- `User`
- `Role`
- NextAuth `Account`, `Session`, `VerificationToken`
- `AuditLog`

## Public Rendering Flow

1. Public localized route enters `src/app/[locale]/[[...slug]]/page.tsx`.
2. `getPageBySlug(locale, slug)` loads the CMS page from PostgreSQL.
3. If the page does not exist or is not published, fallback content from `src/lib/fallback-data.ts` is used.
4. `DynamicPage` maps page sections.
5. `SectionRenderer` dispatches section types to components in `src/components/sections`.

Important section renderers:

- `hero` -> `HeroSection`
- `rich_text` -> `RichTextSection`
- `gallery_masonry` -> gallery variants
- `member_grid` -> founding members
- `neighborhood_archive` -> searchable archive
- `newsletter_signup`, `contact_form`, `event_list`, `announcement_list`, `cta`

## Admin Routing

Admin shell:

```text
src/app/admin/layout.tsx
src/components/admin/admin-shell.tsx
```

Direct editors:

```text
src/app/admin/who-we-are/page.tsx
src/app/admin/what-we-do/page.tsx
```

Both use:

```text
src/components/admin/admin-page-editor-loader.tsx
```

This loader:

- Finds the CMS page by slug
- Creates missing expected pages from fallback content
- Loads media assets for image picking
- Renders `PageSectionEditor`

This is intentional. Direct admin pages should not redirect back into generic `/admin/pages` or show 404 for expected CMS pages.

## Page Section Editing

Main component:

```text
src/components/admin/page-section-editor.tsx
```

Key behaviors:

- Defaults to the first visible section instead of a hidden section
- Marks hidden sections in the sidebar
- Labels the real public What We Do image section as `Public What We Do hero`
- Saves sections through `PUT /api/admin/sections/[id]`
- Reorders sections through `POST /api/admin/sections/reorder`
- Adds sections through `POST /api/admin/pages/[id]/sections`

## What We Do Image System

The public What We Do page does not use the hidden `hero` section.

The public image experience is rendered by:

```text
src/components/sections/rich-text-section.tsx
```

Specifically:

```text
rich_text / what_we_do_gallery
```

Current behavior:

- If `content.images` is not an array, fallback images are used.
- If `content.images` is an array, that admin array is authoritative.
- If the admin array is empty, no parallax images render.
- The renderer no longer appends hardcoded defaults after admin-selected images.

Admin compatibility:

- `/admin/what-we-do` edits the visible public section directly.
- `/admin/hero-pics` still lists the legacy What We Do hero record.
- Saving What We Do in `/admin/hero-pics` now also syncs images into the visible public What We Do gallery section through `src/app/api/admin/hero-pics/[id]/route.ts`.

Reason for this bridge:

The admin user expected Hero Gallery changes to update the public What We Do page. The old data model saved those images into a hidden `hero` section, while the public page rendered `rich_text / what_we_do_gallery`. The bridge keeps that admin workflow working.

## Media and Google Drive

Drive folder registry:

```text
src/lib/drive-folders.ts
```

Drive utilities:

```text
src/lib/google-drive.ts
src/lib/drive-gallery.ts
```

Admin media route:

```text
src/app/admin/media/page.tsx
src/app/api/admin/media/route.ts
src/app/api/admin/gallery/route.ts
src/app/api/admin/gallery/sync-drive/route.ts
```

Important behavior:

- Admin Image Cloud is expected to sync with Google Drive automatically.
- Gallery API flows should sync Drive before returning collections where practical.
- Drive API is preferred when credentials exist.
- Embedded-folder HTML fallback exists for cases where API access is unavailable.

## Gallery System

Admin:

```text
src/components/admin/gallery-album-manager.tsx
```

Public gallery:

```text
src/components/sections/staggered-photo-gallery-section.tsx
src/components/sections/profile-card-gallery.tsx
src/components/sections/featured-photo-gallery.tsx
```

Required public tabs:

- `Famous Figures`
- `Historical Pics`
- `Landmarks`

Behavior to preserve:

- Query-string-driven admin media tabs must remain reachable.
- `Famous Figures` uses the profile card design where applicable.
- All gallery renderers that can surface Famous Figures must stay aligned.
- Drive-backed collections and database collections should not hide each other accidentally.

## Hero Gallery

Admin:

```text
src/app/admin/hero-pics/page.tsx
src/components/admin/hero-pics-manager.tsx
```

API:

```text
src/app/api/admin/hero-pics/[id]/route.ts
```

Behavior:

- Edits `settings.heroScrubFrames` and `content.image` for hero sections.
- For the What We Do page only, saves are mirrored into the visible `what_we_do_gallery` section.
- This bridge exists because the visible public design for What We Do is not a normal `hero` section.

## Founding Members

Admin source:

```text
src/components/admin/member-manager.tsx
src/app/admin/members/page.tsx
```

Public renderer:

```text
src/components/sections/member-grid-section.tsx
```

Behavior:

- Public Founding Members stays admin-driven.
- Images use top object positioning for portrait crops.
- The public renderer receives `CmsSection` and `MemberDto[]`.

## Smooth Scrolling and Motion

Smooth scroll provider:

```text
src/components/layout/smooth-scroll-provider.tsx
```

Behavior:

- Must remain a client component.
- Uses Lenis unless the user prefers reduced motion.
- Required for the intended public scroll experience.

Home cinematic hero:

```text
src/components/sections/hero-scrub-section.tsx
```

Behavior:

- Uses GSAP ScrollTrigger.
- Uses `settings.heroScrubFrames`.
- Falls back to static image if frames do not load.

## SEO

SEO helpers:

```text
src/lib/seo.ts
```

Generated files:

```text
src/app/robots.ts
src/app/sitemap.ts
```

Public page metadata uses CMS page metadata and first available section image where relevant.

## Deployment

The project is configured for Vercel-style standalone output.

Build:

```powershell
pnpm.cmd build
```

Start:

```powershell
pnpm.cmd start
```

Windows/Vercel CLI note:

On this machine, Vercel CLI previously required:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
vercel.cmd --prod --yes
```

Use `vercel.cmd`, not a Unix-shaped command, in this Windows shell.

Production verification:

```powershell
vercel.cmd inspect <deployment-url-or-id>
```

## Operational Checks

Public page:

```powershell
curl.exe -I http://localhost:3000/en
curl.exe -I http://localhost:3000/en/what-we-do
```

Gallery API:

```powershell
curl.exe "http://localhost:3000/api/gallery?locale=en"
```

Admin auth redirect check:

```powershell
curl.exe -I "http://localhost:3000/admin/media?folder=famous-figures"
```

Expected unauthenticated result for admin routes is a redirect.

## Troubleshooting

### What We Do images still look old

Check which admin surface was used.

- `/admin/what-we-do` edits the real visible section.
- `/admin/hero-pics` now mirrors What We Do saves into the visible section.

Check database:

```powershell
@'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const page = await prisma.page.findUnique({
    where: { locale_slug: { locale: 'EN', slug: 'what-we-do' } },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  console.log(JSON.stringify(page?.sections.map((s) => ({
    id: s.id,
    type: s.type,
    variant: s.variant,
    visible: s.isVisible,
    images: Array.isArray(s.content?.images) ? s.content.images.map((i) => i.src) : null,
    frames: Array.isArray(s.settings?.heroScrubFrames) ? s.settings.heroScrubFrames : null,
  })), null, 2));
})().finally(() => prisma.$disconnect());
'@ | node
```

The visible `rich_text / what_we_do_gallery` section should contain the URLs rendered publicly.

### Build fails with Prisma EPERM on Windows

Cause: a running dev server can lock Prisma DLL files.

Fix:

1. Stop local Node/Next processes for this project.
2. Rerun:

```powershell
pnpm.cmd build
```

### `prisma migrate status` hangs

Cause: database connection or remote database state.

Do not place `prisma migrate deploy` inside the regular `build` script for this project. Run migration deployment explicitly in the deployment environment.

### Admin tab bounces or shows Create New Page

Check:

- Direct admin page routes use `AdminPageEditorLoader`.
- Missing expected pages seed from `fallbackPages`.
- Admin shell query tabs use query-aware active state.

### Image Cloud does not match Drive

Check:

- Drive credentials exist.
- Folder IDs in `src/lib/drive-folders.ts` are correct.
- Admin media/gallery APIs are triggering Drive sync.

### Public Famous Figures design is old

Audit all renderers:

- `profile-card-gallery.tsx`
- `staggered-photo-gallery-section.tsx`
- `featured-photo-gallery.tsx`
- CMS/gallery data mapping in `src/lib/cms-data.ts`

## Current Saved Changes in This Documentation Pass

Code changes currently saved in this working branch include:

- What We Do Hero Gallery saves now sync into the public What We Do image section.
- What We Do public image renderer respects admin image removal and no longer appends default images when an admin array exists.
- Admin page section editor starts on the first visible section and labels hidden sections.
- Portrait image crops use top positioning in relevant member/gallery surfaces.
- Famous Figures and related gallery renderers retain the updated profile/card visual behavior.

## Pre-Deployment Checklist

Run:

```powershell
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit
pnpm.cmd build
```

Check:

- `/en`
- `/en/what-we-do`
- `/en/photo-gallery`
- `/admin/media?folder=famous-figures` redirect/auth behavior
- `/api/gallery?locale=en`

Then deploy.
