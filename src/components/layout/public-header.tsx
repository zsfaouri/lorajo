"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LocaleCode, NavigationItemDto } from "@/types/cms";

export function PublicHeader({
  locale,
  navigation,
}: {
  locale: LocaleCode;
  navigation: NavigationItemDto[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const otherLocale = locale === "ar" ? "en" : "ar";
  const otherPath = `/${otherLocale}${pathname.slice(locale.length + 1)}`;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const update = () => setDocked(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={cn("lora-public-header fixed inset-x-0 top-0 z-50 text-white", docked && "lora-public-header--docked")}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-[var(--space-page-x)] transition-all duration-500">
        <Link href={`/${locale}`} className="lora-public-brand flex items-center gap-3" aria-label="LORA home">
          <Image
            src="/lora/brand/lora-logo.png"
            alt="LORA logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full bg-white/92 object-contain p-0.5"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-medium">LORA</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
              {locale === "ar" ? "اللويبدة" : "Luweibdeh"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "group relative text-xs uppercase tracking-[0.18em] transition-colors",
                pathname === item.path && "lora-public-active",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100",
                  pathname === item.path && "scale-x-100",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={otherPath} className="text-xs uppercase tracking-[0.18em] opacity-65 transition hover:opacity-100">
            {otherLocale}
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-current hover:bg-white/10 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[var(--color-black)] px-[var(--space-page-x)] py-6 lg:hidden">
          <nav className="flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.16em] text-white/75"
              >
                {item.label}
              </Link>
            ))}
            <Link href={otherPath} onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.16em] text-white">
              {otherLocale}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
