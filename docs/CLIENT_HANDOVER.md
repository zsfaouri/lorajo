# LORA Website and CMS Handover

Last updated: 2026-05-12  
Project: LORA website and admin CMS  
Repository: `https://github.com/zsfaouri/lorajo.git`  
Production: `https://lora-website-cyan.vercel.app`  
Vercel project: `lora-website`  
Latest verified commit at handover: `6edd65b Simplify admin editing surfaces`

## 1. Purpose

This document explains how to operate, maintain, and hand over the LORA website and admin panel.

The site is a bilingual content-managed website for LORA. Public pages render from database-backed CMS content. The admin panel lets authorized users manage pages, media, gallery albums, founding members, events, announcements, navigation, footer content, theme settings, and user access.

## 2. Important Security Rule

Do not store real passwords, API keys, database URLs, or admin credentials inside this document or the GitHub repository.

Credentials must be transferred through a password manager or a sealed credential sheet.

Use this table during handover:

| Item | Value / Owner |
| --- | --- |
| Admin login URL | `https://lora-website-cyan.vercel.app/admin/login` |
| Admin email | `HANDOVER_REQUIRED` |
| Admin password | `HANDOVER_REQUIRED` |
| GitHub owner/account | `HANDOVER_REQUIRED` |
| Vercel owner/account | `HANDOVER_REQUIRED` |
| Database provider/account | `HANDOVER_REQUIRED` |
| Supabase account | `HANDOVER_REQUIRED` |
| Cloudinary account, if used | `HANDOVER_REQUIRED` |
| Resend account, if used | `HANDOVER_REQUIRED` |
| Domain registrar/DNS account | `HANDOVER_REQUIRED` |

Rotate the admin password after the client receives access.

## 3. Client User Manual

### 3.1 Login

1. Open `https://lora-website-cyan.vercel.app/admin/login`.
2. Enter the admin email and password.
3. After login, the admin dashboard opens.

### 3.2 Dashboard

The dashboard shows direct workflow cards:

- `Create New Page`
- `Who We Are`
- `Photo Gallery`
- `Media Cloud`
- `Events and Announcements`
- `Admin Control`

Use these cards instead of editing code.

### 3.3 Create New Page

Path: `/admin/pages`

Use this page to create bilingual pages.

Fields:

- `Locale`: English or Arabic.
- `Title`: page title.
- `Slug`: URL name. Example: `about-lora`.
- `SEO title`: search engine title.
- `SEO description`: search engine summary.
- `Status`: Draft, Published, or Archived.

After creating a page, open its edit screen to add or edit sections.

### 3.4 Edit Page Sections

Path: `/admin/pages/[page-id]`

Each section has simple controls:

- Section type.
- Design variant.
- Order.
- Visibility.
- Title.
- Subtitle.
- Body text.
- Images.
- Spacing.
- Background token.

Use `Save changes` after editing a section.

Do not enter JSON. The admin panel is designed for normal text fields, dropdowns, uploads, and buttons.

### 3.5 Who We Are

Path: `/admin/who-we-are`

This shortcut opens the editable Who We Are page.

Use it to change:

- Text.
- Images.
- Sections.
- Visibility.
- Page layout.

### 3.6 Founding Members

Path: `/admin/members`

Use this section to manage founding members shown on the public founding members page.

For each member:

- Name.
- Title.
- Slug.
- Photo.
- Sort order.
- Founder status.
- Publish status.

The public page uses the animated founding members design. Admin member records feed that design.

### 3.7 Photo Gallery

Path: `/admin/gallery`

Use this section to manage albums.

Workflow:

1. Choose an album from the left list.
2. Upload images directly into the selected album, or choose images from the existing media list.
3. Edit title/text for each image when needed.
4. Save changes.

For the `Famous Figures` album:

- Each image has its own `Name or title`.
- Each image has its own `Text for this famous figure`.
- Click `Save text` after editing each figure.

The public Famous Figures experience uses each image's own saved text.

### 3.8 Media Cloud

Path: `/admin/media`

Use Media Cloud to upload images once and reuse them across the site.

Workflow:

1. Select one or more image files.
2. Add alt text if needed.
3. Add a category, for example `Famous Figures`, `Events`, `Archive`, or `Who We Are`.
4. Click Upload.

Supported upload types:

- JPG
- PNG
- WebP
- GIF

Current upload limit: 5 MB per image.

### 3.9 Events

Path: `/admin/events`

Use Events to create public event cards.

Fields:

- Language.
- Title.
- Slug.
- Summary.
- Location.
- Start date/time.
- End date/time.
- Image URL.
- Image alt text.
- Action label.
- Event details.
- Status.

Published events are available to event sections on the public site.

### 3.10 Announcements

Path: `/admin/announcements`

Use Announcements for public updates and short articles.

Fields:

- Language.
- Title.
- Slug.
- Excerpt.
- Announcement text.
- Status.

### 3.11 Navigation

Path: `/admin/navigation`

Use this page to control public header navigation.

Typical items:

- Who We Are.
- What We Do.
- Founding Members.
- Photo Gallery.
- Arabic switch link.

### 3.12 Footer

Path: `/admin/footer`

Use this page to control footer text and footer links.

Footer content includes:

- Brand name.
- Description.
- Location.
- Phone.
- Email.
- Credit text.
- Footer links.

Social media links can also be edited from Admin Control.

### 3.13 Theme

Path: `/admin/theme`

Use Theme to update:

- Site colors.
- Typography.
- Section spacing.
- Corner radius.

Only change this after visual review. Theme changes affect the whole site.

### 3.14 Admin Control

Path: `/admin/control`

Use Admin Control for:

- Current admin email.
- Current admin password.
- Social media links.
- User roles and access permissions.

Changing email or password may require signing in again.

## 4. Public Website Routes

Main public route pattern:

```text
/{locale}/{page-slug}
```

Examples:

```text
/en
/en/founding-members
/en/photo-gallery
/en/gallery
/ar
```

The dynamic route is implemented at:

```text
src/app/[locale]/[[...slug]]/page.tsx
```

## 5. Admin Routes

```text
/admin/login
/admin
/admin/pages
/admin/pages/[id]
/admin/who-we-are
/admin/site-builder
/admin/media
/admin/gallery
/admin/members
/admin/events
/admin/announcements
/admin/articles
/admin/projects
/admin/navigation
/admin/footer
/admin/theme
/admin/control
/admin/messages
/admin/newsletter
/admin/volunteers
```

Logged-out users are redirected to:

```text
/admin/login
```

## 6. Technology Stack

- Framework: Next.js 15 App Router.
- UI: React 19.
- Language: TypeScript.
- Styling: Tailwind CSS 4 and CSS variables in `src/app/globals.css`.
- Database ORM: Prisma.
- Authentication: NextAuth credentials provider.
- Password hashing: bcryptjs.
- Media storage: Supabase Storage, with optional Cloudinary support.
- Email/contact support: Resend.
- Deployment: Vercel.

## 7. Repository Structure

```text
.
├── docs/
│   └── CLIENT_HANDOVER.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── lora/brand/lora-logo.png
├── scripts/
│   ├── copy-standalone-assets.ts
│   └── import-drive-media.ts
├── src/
│   ├── app/
│   │   ├── [locale]/[[...slug]]/page.tsx
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── admin/
│   │   ├── cms/
│   │   ├── layout/
│   │   ├── sections/
│   │   └── ui/
│   ├── lib/
│   └── types/
├── .env.example
├── next.config.ts
├── package.json
└── pnpm-lock.yaml
```

## 8. Main Files

Admin shell and navigation:

```text
src/components/admin/admin-shell.tsx
```

Admin dashboard:

```text
src/app/admin/page.tsx
```

Page section editor:

```text
src/components/admin/page-section-editor.tsx
```

Gallery manager:

```text
src/components/admin/gallery-album-manager.tsx
```

Media cloud:

```text
src/components/admin/media-library-manager.tsx
```

Founding members manager:

```text
src/components/admin/member-manager.tsx
```

Admin control:

```text
src/components/admin/admin-control-panel.tsx
```

Public section renderer:

```text
src/components/cms/section-renderer.tsx
```

Founding members public design:

```text
src/components/sections/member-grid-section.tsx
```

Events public card:

```text
src/components/ui/event-card.tsx
src/components/sections/event-list-section.tsx
```

Famous Figures/gallery public design:

```text
src/components/sections/staggered-photo-gallery-section.tsx
src/components/sections/sphere-image-grid.tsx
```

CMS data mapping:

```text
src/lib/cms-data.ts
src/lib/admin-data.ts
```

## 9. Database Models

Primary Prisma models:

- `User`: admin user accounts.
- `Role`: access roles.
- `Page`: public pages.
- `PageSection`: page sections and layout content.
- `NavigationItem`: header navigation.
- `FooterColumn`: footer content and links.
- `SiteTheme`: theme tokens.
- `Member`: founding members and public people records.
- `GalleryCollection`: gallery albums.
- `GalleryImage`: album images with per-image caption/text.
- `MediaAsset`: uploaded media.
- `Event`: events.
- `Article`: announcements/articles.
- `Project`: project records.
- `ContactMessage`: public contact form submissions.
- `NewsletterSubscriber`: newsletter signups.
- `VolunteerApplication`: volunteer form submissions.

Database schema file:

```text
prisma/schema.prisma
```

Seed file:

```text
prisma/seed.ts
```

## 10. Environment Variables

Use `.env.example` as the reference.

Required:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/lora_cms?schema=public"
AUTH_SECRET="replace-with-a-strong-secret"
AUTH_URL="https://lorajo.org"
NEXTAUTH_URL="https://lorajo.org"
ADMIN_EMAIL="admin@lorajo.org"
ADMIN_PASSWORD="change-this-password"
NEXT_PUBLIC_SITE_URL="https://lorajo.org"
```

Media:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Email:

```env
RESEND_API_KEY=""
CONTACT_TO_EMAIL="info@lorajo.org"
```

Security requirement:

- `AUTH_SECRET` must be long and random.
- `ADMIN_PASSWORD` must be rotated before final client handover.
- Never commit `.env`.

## 11. Local Development

Install dependencies:

```powershell
pnpm install
```

Generate Prisma client:

```powershell
pnpm prisma:generate
```

Run database migrations in development:

```powershell
pnpm prisma:migrate
```

Seed database:

```powershell
pnpm db:seed
```

Start development server:

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin/login
```

## 12. Build and Verification

Run lint:

```powershell
pnpm lint
```

Validate Prisma schema:

```powershell
pnpm prisma validate
```

Run production build:

```powershell
pnpm build
```

Expected result:

- Prisma client generated.
- Next build compiles successfully.
- Static/dynamic route list is printed.
- Exit code is `0`.

## 13. Deployment

Production deploy command used in this environment:

```powershell
$env:NODE_OPTIONS='--use-system-ca'; vercel --prod --yes
```

The local Vercel project link is:

```json
{
  "projectId": "prj_sgJqS9X2MbLyjujVxgC6n9Vs7agk",
  "orgId": "team_houz3Q552NzLpBwzeTQ2H42b",
  "projectName": "lora-website"
}
```

Production should resolve to:

```text
https://lora-website-cyan.vercel.app
```

If a custom domain is connected later, update:

```env
AUTH_URL
NEXTAUTH_URL
NEXT_PUBLIC_SITE_URL
```

## 14. Git Workflow

Check current changes:

```powershell
git status --short
```

Commit:

```powershell
git add src prisma docs package.json pnpm-lock.yaml
git commit -m "Describe change"
```

Push:

```powershell
git push origin main
```

Current remote:

```text
https://github.com/zsfaouri/lorajo.git
```

## 15. Production Smoke Test Checklist

Run after each release.

Public pages:

```text
https://lora-website-cyan.vercel.app/en
https://lora-website-cyan.vercel.app/en/founding-members
https://lora-website-cyan.vercel.app/en/photo-gallery
https://lora-website-cyan.vercel.app/en/gallery
```

Admin:

```text
https://lora-website-cyan.vercel.app/admin/login
```

Expected:

- Login page loads.
- LORA logo appears.
- Logged-out admin routes redirect to `/admin/login`.

Public APIs:

```text
/api/theme
/api/navigation
/api/footer
/api/members
/api/gallery
/api/events
```

Expected:

- Status `200`.

Admin APIs while logged out:

```text
/api/admin/media
/api/admin/pages
/api/admin/gallery
```

Expected:

- Status `401`.

## 16. Operational Notes

### Media Uploads

Images are uploaded through the admin panel.

Limit:

```text
5 MB per image
```

If larger images are needed, either compress images before upload or update the upload limit in:

```text
src/lib/admin-upload.ts
src/app/api/admin/media/route.ts
```

### Famous Figures Text

Famous Figures is controlled through:

```text
/admin/gallery
```

Select the `Famous Figures` album.

Each image has:

- Name or title.
- Text for this famous figure.
- Save text button.

Public display uses:

- `GalleryImage.alt` as the title/name.
- `GalleryImage.caption` as the text.

### Founding Members

Public page:

```text
/en/founding-members
```

Admin:

```text
/admin/members
```

Public design file:

```text
src/components/sections/member-grid-section.tsx
```

### Events

Admin:

```text
/admin/events
```

Public event card:

```text
src/components/ui/event-card.tsx
```

Events render through:

```text
src/components/sections/event-list-section.tsx
```

## 17. Backup and Recovery

Minimum backup items:

- Database backup.
- Supabase media bucket.
- Vercel environment variables.
- GitHub repository.
- Domain DNS records.

Recommended cadence:

- Database: daily automated backup.
- Media bucket: weekly backup or provider-level replication.
- Environment variables: export after each change and store securely.
- GitHub: all production code changes must be committed and pushed.

## 18. Credential Handover Checklist

Provide these through a secure channel:

```text
Admin CMS email
Admin CMS password
GitHub access
Vercel access
Database access
Supabase access
Cloudinary access, if active
Resend access, if active
Domain registrar access
DNS provider access
Email inbox access for CONTACT_TO_EMAIL
```

After handover:

1. Client signs in.
2. Client changes admin password in `/admin/control`.
3. Client confirms email/social links.
4. Client confirms domain ownership.
5. Client confirms database and media access.
6. Developer access is removed or downgraded.

## 19. Known Limitations

- Media upload limit is currently 5 MB per image.
- Admin role permissions are assignable by role, but the UI does not expose low-level permission JSON editing.
- Some page layouts are controlled by section variants. Changing section type can affect the public page layout.
- If production domain changes, authentication URLs must be updated in Vercel environment variables.

## 20. Final Handover Status

Last verified commands:

```powershell
pnpm lint
pnpm prisma validate
pnpm build
```

Last verified production checks:

- Public pages returned `200`.
- Public APIs returned `200`.
- Admin login loaded with logo.
- Logged-out admin pages redirected to `/admin/login`.
- Logged-out admin APIs returned `401`.

The client can operate the site through the admin panel without editing code.
