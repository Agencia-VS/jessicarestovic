import type { Metadata, Viewport } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

/** Texto de apoyo, navegación y pies de obra. */
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-public-sans",
  display: "swap",
});

/** Títulos, nombres de obra y párrafos de presentación. */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.nombre} — ${siteConfig.rol}`,
    template: `%s — ${siteConfig.nombre}`,
  },
  description: siteConfig.descripcion,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.nombre,
    title: `${siteConfig.nombre} — ${siteConfig.rol}`,
    description: siteConfig.descripcion,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F5F2ED",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={siteConfig.lang}
      className={`${publicSans.variable} ${newsreader.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
