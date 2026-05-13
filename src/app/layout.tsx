import type { Metadata, Viewport } from "next";

import "./globals.css";

import { getActiveTheme } from "@/lib/cms-data";
import { absoluteUrl, defaultOgImage, defaultSeoDescription, defaultSeoTitle, organizationName, siteName, siteUrl } from "@/lib/seo";
import { themeToStyle } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: siteName,
  title: {
    default: defaultSeoTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  keywords: [
    "LORA",
    "Luweibdeh",
    "Jabal Al-Luweibdeh",
    "Amman heritage",
    "Jordan heritage",
    "old residents association",
    "cultural heritage",
    "historic preservation",
  ],
  authors: [{ name: organizationName }],
  creator: organizationName,
  publisher: organizationName,
  category: "community organization",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      ar: "/ar",
      "x-default": "/en",
    },
  },
  icons: {
    icon: [
      { url: "/lora/brand/lora-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/lora/brand/lora-logo.png",
    apple: "/lora/brand/lora-logo.png",
  },
  openGraph: {
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: "/en",
    siteName,
    images: [
      {
        url: absoluteUrl(defaultOgImage),
        width: 512,
        height: 512,
        alt: "LORA logo",
      },
    ],
    locale: "en_US",
    alternateLocale: ["ar_JO"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: [absoluteUrl(defaultOgImage)],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#01963c",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();

  return (
    <html lang="en" className="h-full" style={themeToStyle(theme)} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
