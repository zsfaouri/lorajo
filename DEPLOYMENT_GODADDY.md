# LORA GoDaddy Deployment

This app is a Next.js Node application with PostgreSQL. Use a GoDaddy VPS or a GoDaddy plan where Node.js and PostgreSQL can run. Standard shared cPanel hosting is not enough for this stack.

## Server Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL 15 or newer
- Reverse proxy with SSL, usually Nginx or Apache
- Domain DNS access for `lorajo.org`

## Environment Variables

Create `.env` on the server:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/lora_cms?schema=public"
AUTH_SECRET="generate-a-long-random-secret"
AUTH_URL="https://lorajo.org"
NEXTAUTH_URL="https://lorajo.org"
NEXT_PUBLIC_SITE_URL="https://lorajo.org"

ADMIN_EMAIL="admin@lorajo.org"
ADMIN_PASSWORD="replace-before-seeding"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

RESEND_API_KEY=""
CONTACT_TO_EMAIL="info@lorajo.org"
```

## Build

```bash
pnpm install --frozen-lockfile
pnpm exec prisma db push
pnpm db:seed
pnpm media:import-drive
pnpm build
PORT=3000 pnpm start
```

The app runs from `.next/standalone/server.js`. It listens on the port set by `PORT`, or `3000` by default.
The build script copies `public` and `.next/static` into `.next/standalone`, so the standalone server includes gallery images and static assets.

## GoDaddy DNS

Point the domain to the server:

- `A` record: `@` -> VPS public IP
- `CNAME` record: `www` -> `lorajo.org`

## Nginx Reverse Proxy

```nginx
server {
  server_name lorajo.org www.lorajo.org;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Use Certbot or GoDaddy SSL to enable HTTPS.

## Process Manager

Use `pm2`:

```bash
pnpm add -g pm2
pm2 start "pnpm start" --name lora-cms
pm2 save
pm2 startup
```

## Admin

Admin login path:

```text
https://lorajo.org/admin/login
```

Change `ADMIN_PASSWORD` before seeding production.
