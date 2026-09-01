import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Italianno, Schibsted_Grotesk } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

/** Texto y navegación. */
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-schibsted",
  display: "swap",
});

/** Nombres de serie en el índice. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

/** La firma manuscrita que hace de logotipo (§06). */
const italianno = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italianno",
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
  themeColor: "#FCFBF8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={siteConfig.lang}
      className={`${schibsted.variable} ${instrument.variable} ${italianno.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
