"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const otherLocale = locale === "ar" ? "en" : "ar";
  const otherPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--color-black)]/82 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-[var(--space-page-x)]">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="LORA home">
          <Image
            src="/lora/brand/lora-logo.png"
            alt="LORA logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-medium">LORA</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
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
                "group relative text-xs uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white",
                pathname === item.path && "text-white",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-[var(--color-heritage-green)] transition-transform duration-300 group-hover:scale-x-100",
                  pathname === item.path && "scale-x-100",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={otherPath} className="text-xs uppercase tracking-[0.14em] text-white/60 hover:text-white">
            {otherLocale}
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 lg:hidden"
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
