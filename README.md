# LORA Website CMS

Production website and admin CMS for the Luweibdeh Old Residents Association.

The app is a Next.js 15 site with a PostgreSQL-backed CMS, Prisma data layer, Drive-backed media workflows, localized public pages, and an authenticated admin dashboard.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma with PostgreSQL
- NextAuth
- Google Drive media import/sync
- Framer Motion, GSAP, and Lenis for public motion experiences

## Local Setup

Install dependencies:

```powershell
pnpm.cmd install
```

Copy environment values:

```powershell
Copy-Item .env.example .env
```

Start the local PostgreSQL instance if using the bundled local data folder:

```powershell
pnpm.cmd pg:start
```

Apply or create migrations as needed:

```powershell
pnpm.cmd prisma:migrate
```

Seed starter content:

```powershell
pnpm.cmd db:seed
```

Run development server:

```powershell
pnpm.cmd dev
```

Open:

```text
http://localhost:3000
```

## Main Scripts

```powershell
pnpm.cmd dev
pnpm.cmd build
pnpm.cmd start
pnpm.cmd lint
pnpm.cmd prisma:generate
pnpm.cmd prisma:migrate
pnpm.cmd prisma:studio
pnpm.cmd db:seed
pnpm.cmd media:import-drive
```

## Admin Areas

- `/admin` dashboard
- `/admin/pages` generic page editor
- `/admin/who-we-are` direct Who We Are editor
- `/admin/what-we-do` direct What We Do editor
- `/admin/media` Drive-backed Image Cloud
- `/admin/gallery` public gallery collections
- `/admin/hero-pics` hero image manager
- `/admin/members` founding members
- `/admin/navigation` navigation editor
- `/admin/footer` footer editor
- `/admin/theme` theme tokens
- `/admin/control` admin account and site controls

## Public Routes

- `/en`
- `/en/who-we-are`
- `/en/what-we-do`
- `/en/founding-members`
- `/en/photo-gallery`
- `/en/neighborhood-archive`
- Arabic equivalents under `/ar`

## Current Important Behavior

- Public pages are CMS-driven from `Page` and `PageSection`.
- Direct admin routes for `who-we-are` and `what-we-do` load through `AdminPageEditorLoader`.
- Missing expected CMS pages are seeded from fallback data instead of showing a 404.
- Admin media syncs Google Drive before returning media/gallery data.
- Public gallery tabs preserve `Famous Figures`, `Historical Pics`, and `Landmarks`.
- The What We Do public image section uses the visible `rich_text / what_we_do_gallery` section.
- Saving What We Do in `/admin/hero-pics` also syncs its images into that public What We Do section.

## Validation

Run before deployment:

```powershell
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit
pnpm.cmd build
```

## Documentation

Full project documentation is in:

```text
docs/PROJECT_DOCUMENTATION.md
```
