import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/lib/site-config";
import { urlDelSitio } from "@/lib/entorno";
import "./globals.css";

/**
 * La tipografía del sitio, una sola.
 *
 * Antes convivían un serif editorial para los títulos y este sans para el
 * resto. Jessica pidió la del menú para toda la página, así que el serif se
 * fue: una familia menos que descargar y una decisión menos por pantalla.
 *
 * Se piden también los pesos que usaba el serif —200 para los títulos grandes
 * y la itálica del visor— para que nada caiga a una versión sintética.
 */
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(urlDelSitio()),
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
    url: urlDelSitio(),
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
      className={publicSans.variable}
    >
      <body>
        {children}
        {/*
          El panel de visitas: cuántas personas entran, qué páginas miran y de
          dónde llegan. Se ve en Vercel, en la pestaña Analytics del proyecto.

          No usa cookies ni identifica a nadie, así que no hace falta pedir
          consentimiento ni ampliar la página de privacidad. Y no le manda
          nada a Jessica al teléfono: un aviso por visita serían cientos al
          día; lo útil es poder mirar el resumen cuando quiera.
        */}
        <Analytics />
      </body>
    </html>
  );
}
