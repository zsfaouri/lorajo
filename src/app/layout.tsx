import type { Metadata } from "next";

import "./globals.css";

import { getActiveTheme } from "@/lib/cms-data";
import { themeToStyle } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3002"),
  title: "LORA - Luweibdeh Old Residents Association",
  description: "A modern bilingual CMS-powered website for LORA in Jabal Al-Luweibdeh, Amman.",
  icons: {
    icon: [
      { url: "/lora/brand/lora-logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/lora/brand/lora-logo.png",
    apple: "/lora/brand/lora-logo.png",
  },
  openGraph: {
    title: "LORA - Luweibdeh Old Residents Association",
    description: "Our cultural heritage is our identity.",
    siteName: "LORA",
    images: [
      {
        url: "/lora/brand/lora-logo.png",
        width: 512,
        height: 512,
        alt: "LORA logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LORA - Luweibdeh Old Residents Association",
    description: "Our cultural heritage is our identity.",
    images: ["/lora/brand/lora-logo.png"],
  },
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
