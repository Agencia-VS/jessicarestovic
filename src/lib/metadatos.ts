import type { Metadata } from "next";
import type { FotoLista } from "@/lib/data/tipos";
import { urlDelSitio } from "@/lib/entorno";
import { siteConfig } from "@/lib/site-config";

/** Una descripción breve, sin saltos de línea ni palabras cortadas. */
function resumirDescripcion(texto: string): string {
  const limpio = texto.replace(/\s+/g, " ").trim() || siteConfig.descripcion;
  if (limpio.length <= 160) return limpio;
  const inicio = limpio.slice(0, 157);
  const corte = inicio.lastIndexOf(" ");
  return `${inicio.slice(0, corte > 100 ? corte : inicio.length).trimEnd()}…`;
}

/**
 * Next reemplaza los objetos Open Graph y Twitter completos al heredarlos.
 * Cada página declara los suyos para compartir su título, URL e imagen reales.
 */
export function metadatosPagina({
  titulo,
  descripcion = siteConfig.descripcion,
  ruta,
  imagen,
}: {
  titulo?: string;
  descripcion?: string;
  ruta: string;
  imagen?: FotoLista | null;
}): Metadata {
  const tituloCompleto = titulo
    ? `${titulo} — ${siteConfig.nombre}`
    : `${siteConfig.nombre} — ${siteConfig.rol}`;
  const resumen = resumirDescripcion(descripcion);
  const url = new URL(ruta, urlDelSitio()).href;
  // SVG, AVIF y HEIC no tienen soporte uniforme en las vistas previas sociales.
  // El JPEG de marca siempre está disponible si la portada usa esos formatos.
  const foto = imagen && !/\.(?:svg|avif|heic)(?:[?#]|$)/i.test(imagen.src) ? imagen : null;
  const imagenSocial = foto
    ? {
        url: new URL(foto.src, urlDelSitio()).href,
        alt: foto.alt || tituloCompleto,
        ...(foto.ancho && foto.alto ? { width: foto.ancho, height: foto.alto } : {}),
      }
    : {
        url: new URL("/compartir-jessica.jpg", urlDelSitio()).href,
        alt: `${siteConfig.nombre} — ${siteConfig.rol}. Isotipo de la artista.`,
        width: 1200,
        height: 630,
      };

  return {
    title: { absolute: tituloCompleto },
    description: resumen,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      siteName: siteConfig.nombre,
      title: tituloCompleto,
      description: resumen,
      url,
      images: [imagenSocial],
    },
    twitter: {
      card: "summary_large_image",
      title: tituloCompleto,
      description: resumen,
      images: [imagenSocial],
    },
  };
}
