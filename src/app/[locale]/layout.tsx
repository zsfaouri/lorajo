import { notFound } from "next/navigation";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { getFooter, getNavigation } from "@/lib/cms-data";
import { locales, normalizeLocale } from "@/lib/cms-constants";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as "en" | "ar")) notFound();

  const locale = normalizeLocale(rawLocale);
  const [navigation, footer] = await Promise.all([getNavigation(locale), getFooter(locale)]);

  return (
    <SmoothScrollProvider>
      <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[var(--color-soft-white)]">
        <PublicHeader locale={locale} navigation={navigation} />
        <main>{children}</main>
        <PublicFooter columns={footer} navigation={navigation} />
      </div>
    </SmoothScrollProvider>
  );
}
