"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Facebook, Instagram, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FooterColumnDto, NavigationItemDto } from "@/types/cms";

type FooterLink = {
  label: string;
  href: string;
};

type SocialLink = {
  icon: ReactNode;
  href: string;
  label: string;
};

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNavLinks(navigation: NavigationItemDto[], columns: FooterColumnDto[]): FooterLink[] {
  const footerLinks = columns.flatMap((column) => column.links ?? []);
  if (footerLinks.length > 0) return footerLinks;

  return navigation
    .filter((item) => item.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ label: item.label, href: item.path }));
}

export function PublicFooter({
  columns,
  navigation = [],
  className,
}: {
  columns: FooterColumnDto[];
  navigation?: NavigationItemDto[];
  className?: string;
}) {
  const primary = columns[0];
  const content = primary?.content ?? {};
  const brandName = primary?.title ?? "LORA";
  const brandDescription = getString(content.text, "Luweibdeh old residents association");
  const email = getString(content.email, "info@lorajo.org");
  const location = getString(content.location, "Amman, Paris square");
  const phone = getString(content.phone, "+962 7 7930 6500");
  const credit = getString(content.credit, "Website built by Zworks, Dubai");
  const navLinks = getNavLinks(navigation, columns);
  const socialLinks: SocialLink[] = [
    { icon: <Mail className="h-full w-full" />, href: `mailto:${email}`, label: "Email" },
    {
      icon: <Instagram className="h-full w-full" />,
      href: "https://www.instagram.com/lora.amman?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      label: "Instagram",
    },
    { icon: <Facebook className="h-full w-full" />, href: "https://www.facebook.com/lora.amman", label: "Facebook" },
  ];

  return (
    <section className={cn("relative mt-0 w-full overflow-hidden", className)}>
      <footer className="relative mt-20 border-t border-black/10 bg-[var(--color-soft-white)]">
        <div className="relative mx-auto flex min-h-[30rem] max-w-7xl flex-col justify-between p-4 py-10 sm:min-h-[35rem] md:min-h-[40rem]">
          <div className="mb-12 flex w-full flex-col sm:mb-20 md:mb-0">
            <div className="flex w-full flex-col items-center">
              <div className="flex flex-1 flex-col items-center space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-black">{brandName}</span>
                </div>
                <p className="w-full max-w-sm px-4 text-center font-semibold text-black/58 sm:w-96 sm:px-0">
                  {brandDescription}
                </p>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-xs uppercase tracking-[0.16em] text-black/45">
                  <span>{location}</span>
                  <span>{phone}</span>
                  <Link href={`mailto:${email}`} className="transition-colors hover:text-black">
                    {email}
                  </Link>
                </div>
              </div>

              <div className="mb-8 mt-4 flex gap-4">
                {socialLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-black/45 transition-colors hover:text-black"
                    target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  >
                    <div className="h-6 w-6 duration-300 hover:scale-110">{link.icon}</div>
                    <span className="sr-only">{link.label}</span>
                  </Link>
                ))}
              </div>

              {navLinks.length > 0 ? (
                <div className="flex max-w-full flex-wrap justify-center gap-4 px-4 text-sm font-medium text-black/52">
                  {navLinks.map((link) => (
                    <Link key={`${link.label}-${link.href}`} className="duration-300 hover:font-semibold hover:text-black" href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-20 flex flex-col items-center justify-center gap-2 px-4 md:mt-24 md:flex-row md:items-center md:justify-between md:gap-1 md:px-0">
            <p className="text-center text-base text-black/48 md:text-left">
              &copy;{new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            <p className="text-center text-base text-black/48 md:text-right">{credit}</p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-40 left-1/2 max-w-[95vw] -translate-x-1/2 select-none bg-gradient-to-b from-black/20 via-black/10 to-transparent bg-clip-text px-4 text-center font-extrabold leading-none tracking-normal text-transparent md:bottom-32"
          style={{ fontSize: "clamp(3rem, 12vw, 10rem)" }}
        >
          {brandName.toUpperCase()}
        </div>

        <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-3xl border-2 border-black/10 bg-[var(--color-soft-white)]/60 p-3 shadow-[0_0_20px_rgba(0,0,0,0.28)] backdrop-blur-sm duration-300 hover:border-black/50 md:bottom-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-black/80 shadow-lg sm:h-16 sm:w-16 md:h-24 md:w-24">
            <Image
              src="/lora/brand/lora-logo.png"
              alt="LORA logo"
              width={78}
              height={78}
              className="h-9 w-9 rounded-full object-contain sm:h-12 sm:w-12 md:h-[4.6rem] md:w-[4.6rem]"
            />
          </div>
        </div>

        <div className="absolute bottom-32 left-1/2 h-1 w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-black/12 to-transparent backdrop-blur-sm sm:bottom-[8.5rem]" />
        <div className="absolute bottom-28 h-24 w-full bg-gradient-to-t from-[var(--color-soft-white)] via-[var(--color-soft-white)]/80 to-[var(--color-soft-white)]/40 blur-[1em]" />
      </footer>
    </section>
  );
}
