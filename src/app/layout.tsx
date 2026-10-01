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

/**
 * Todas las páginas se arman en cada visita, y se declara acá para que el
 * build no tenga que adivinarlo.
 *
 * Cada consulta pasa por el cliente de Supabase con sesión, que lee las
 * cookies, así que ninguna página puede servirse precompilada. Sin esta línea
 * Next lo deducía en el build probando las páginas contra la base, y el
 * resultado dependía de lo que pasara en ese momento. Las páginas de cada
 * muestra y de cada conjunto se precompilaban a partir de la lista de slugs;
 * si esa consulta volvía vacía, o el build no veía las variables de Supabase,
 * quedaban clasificadas como estáticas y en producción todas respondían 500
 * al leer las cookies. Por eso tampoco hay `generateStaticParams`.
 */
export const dynamic = "force-dynamic";

/**
 * Marca cada foto en cuanto llegó, para que entre con un fundido (`[data-foto]`
 * en `globals.css`) en vez de pintarse a franjas.
 *
 * Es un script en línea, en el `<head>`, porque las fotos llegan antes de que
 * React tome la página: esperar a la hidratación dejaba la portada escondida,
 * ya descargada, un segundo de más en el teléfono. Así corre antes de que
 * exista la primera foto y no se le escapa ninguna, tampoco las que llegan
 * después al navegar dentro del sitio. Escucha en la fase de captura porque el
 * `load` de una imagen no sube por el documento.
 *
 * Espera a que la foto esté decodificada, así el fundido no arranca en un
 * cuadro vacío.
 */
const MARCAR_FOTOS = `
document.addEventListener("load", function (evento) {
  var foto = evento.target.parentNode;
  if (!foto || !foto.hasAttribute || !foto.hasAttribute("data-foto")) return;
  var marcar = function () { foto.setAttribute("data-cargada", ""); };
  var imagen = evento.target;
  imagen.decode ? imagen.decode().then(marcar, marcar) : marcar();
}, true);
`;

/** Sin JavaScript nadie marca las fotos: se muestran tal cual llegan. */
const SIN_SCRIPT = "[data-foto]{background:none}[data-foto]>img{opacity:1}";

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: MARCAR_FOTOS }} />
        <noscript>
          <style>{SIN_SCRIPT}</style>
        </noscript>
      </head>
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
