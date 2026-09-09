import type { NextConfig } from "next";
import { hostDe } from "./src/lib/url";

// Una variable mal escrita no debe impedir que el sitio compile: si no se
// puede interpretar, se cae al patrón genérico de Supabase.
const host = hostDe(process.env.SUPABASE_URL);

if (!host) {
  console.warn(
    `[next.config] SUPABASE_URL ${
      process.env.SUPABASE_URL ? "no se pudo interpretar como URL" : "no está disponible en el build"
    }. Las fotos se optimizarán con el patrón genérico de Supabase; con la ` +
      "variable cargada se usa el host exacto. Valor esperado: https://<ref>.supabase.co",
  );
}

/**
 * Qué URLs puede buscar el optimizador de imágenes.
 *
 * El host exacto cuando se conoce, y como red de seguridad cualquier proyecto
 * de Supabase bajo la ruta pública de Storage.
 *
 * El respaldo no es adorno: esta lista se hornea en el build, así que un
 * despliegue construido antes de cargar `SUPABASE_URL` —o con la variable
 * limitada a otro entorno— quedaba con la lista vacía. El sitio se veía con
 * todos sus datos y **todas las fotos rotas**, porque `next/image` responde 400
 * a un patrón que no calza y el navegador pinta el texto alternativo. Un fallo
 * silencioso y muy difícil de leer desde afuera.
 *
 * El comodín solo amplía de qué host puede *leer* el optimizador, y siempre
 * bajo `/storage/v1/object/public/`, que es contenido público por definición.
 */
const patronesDeImagen = [
  ...(host
    ? [{ protocol: "https" as const, hostname: host, pathname: "/storage/v1/object/public/**" }]
    : []),
  {
    protocol: "https" as const,
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/serie/ensambles-al-cubo", destination: "/exposiciones/ensambles-al-cubo/obras", permanent: true },
      { source: "/serie/sur", destination: "/exposiciones/sur/obras", permanent: true },
      { source: "/serie/de-lo-precario", destination: "/exposiciones/de-lo-precario/obras", permanent: true },
      { source: "/serie/volumenes", destination: "/exposiciones/volumenes/obras", permanent: true },
      { source: "/serie/a-partir-de-lo-simple", destination: "/exposiciones/a-partir-de-lo-simple/obras", permanent: true },
      { source: "/serie/de-lo-residual", destination: "/exposiciones/de-lo-residual-y-lo-efimero/obras", permanent: true },
      { source: "/serie/espacios-intimos", destination: "/exposiciones/ensambles-al-cubo/obras", permanent: true },
      { source: "/serie/:slug", destination: "/exposiciones", permanent: true },
      // «Trabajos recientes» dejó de ser una página que junta todo y pasó a ser
      // un conjunto dentro de «Trabajos».
      { source: "/trabajos-recientes", destination: "/trabajos", permanent: true },
      { source: "/trabajos-recientes/:path+", destination: "/trabajos", permanent: true },
      // El índice plano de obras desapareció: las fotos viven dentro de su
      // grupo. Las rutas de una obra suelta —alta, edición, carpeta— siguen.
      { source: "/admin/obras", destination: "/admin/trabajos", permanent: false },
      { source: "/admin/trabajos-recientes", destination: "/admin/trabajos", permanent: false },
      { source: "/admin/trabajos-recientes/:path+", destination: "/admin/obras/:path+", permanent: false },
      { source: "/admin/series/:path*", destination: "/admin/exposiciones/:path*", permanent: false },
    ];
  },
  images: {
    // Las obras se sirven desde Supabase Storage. next/image las optimiza y
    // genera las versiones para celular y escritorio (spec de imágenes, §08).
    remotePatterns: patronesDeImagen,
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
