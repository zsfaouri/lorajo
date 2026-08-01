/**
 * Seed script: creates the initial admin user and a default theme.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *
 * Set env vars:
 *   ADMIN_EMAIL    — defaults to admin@lorajo.org
 *   ADMIN_PASSWORD — defaults to changeme123
 *   DATABASE_URL   — required
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@lorajo.org";
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  console.log("Seeding database...");

  // ─── Admin user ──────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "LORA Admin" },
  });
  console.log(`Admin user: ${admin.email}`);

  // ─── Default theme ──────────────────────────────────
  const existingTheme = await prisma.siteTheme.findFirst({ where: { isActive: true } });
  if (!existingTheme) {
    await prisma.siteTheme.create({
      data: {
        name: "LORA Default",
        isActive: true,
        tokens: {
          colors: {
            primary: "#B8860B",
            secondary: "#1a1a2e",
            accent: "#DAA520",
            background: "#FAFAF5",
            surface: "#FFFFFF",
            text: "#1a1a2e",
            textLight: "#6b7280",
            border: "#e5e7eb",
          },
          typography: {
            fontFamily: "'Inter', sans-serif",
            fontFamilyArabic: "'Noto Sans Arabic', sans-serif",
            baseFontSize: "16px",
            headingWeight: "700",
          },
          spacing: {
            sectionPadding: "5rem",
            containerMaxWidth: "1280px",
          },
          radii: {
            card: "0.75rem",
            button: "0.5rem",
            input: "0.375rem",
          },
        },
      },
    });
    console.log("Default theme created.");
  } else {
    console.log("Active theme already exists, skipping.");
  }

  // ─── Default navigation (EN + AR) ──────────────────
  const navCount = await prisma.navigationItem.count();
  if (navCount === 0) {
    const enNav = [
      { locale: "EN" as const, label: "Who We Are", path: "/en/who-we-are", sortOrder: 0 },
      { locale: "EN" as const, label: "Photo Gallery", path: "/en/photo-gallery", sortOrder: 1 },
      { locale: "EN" as const, label: "Neighborhood Archive", path: "/en/neighborhood-archive", sortOrder: 2 },
      { locale: "EN" as const, label: "Join Us", path: "/en/join-us", sortOrder: 3 },
    ];
    const arNav = [
      { locale: "AR" as const, label: "من نحن", path: "/ar/who-we-are", sortOrder: 0 },
      { locale: "AR" as const, label: "معرض الصور", path: "/ar/photo-gallery", sortOrder: 1 },
      { locale: "AR" as const, label: "أرشيف الحي", path: "/ar/neighborhood-archive", sortOrder: 2 },
      { locale: "AR" as const, label: "انضم إلينا", path: "/ar/join-us", sortOrder: 3 },
    ];
    for (const item of [...enNav, ...arNav]) {
      await prisma.navigationItem.create({ data: { ...item, isVisible: true } });
    }
    console.log("Default navigation created.");
  }

  // ─── Default footer (EN + AR) ──────────────────────
  const footerCount = await prisma.footerColumn.count();
  if (footerCount === 0) {
    await prisma.footerColumn.create({
      data: {
        locale: "EN",
        title: "LORA",
        sortOrder: 0,
        content: { text: "Luweibdeh Old Residents Association — preserving the heritage of one of Amman's most historic neighborhoods." },
        links: [
          { label: "Who We Are", href: "/en/who-we-are" },
          { label: "Photo Gallery", href: "/en/photo-gallery" },
          { label: "Join Us", href: "/en/join-us" },
        ],
      },
    });
    await prisma.footerColumn.create({
      data: {
        locale: "AR",
        title: "لورا",
        sortOrder: 0,
        content: { text: "جمعية سكان اللويبدة القدامى — الحفاظ على تراث أحد أعرق أحياء عمّان." },
        links: [
          { label: "من نحن", href: "/ar/who-we-are" },
          { label: "معرض الصور", href: "/ar/photo-gallery" },
          { label: "انضم إلينا", href: "/ar/join-us" },
        ],
      },
    });
    console.log("Default footer created.");
  }

  console.log("\nSeed complete!");
  console.log(`\nLogin with:\n  Email: ${email}\n  Password: ${password}`);
  console.log("\n*** CHANGE YOUR PASSWORD AFTER FIRST LOGIN ***\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
