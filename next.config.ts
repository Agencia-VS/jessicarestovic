import type { NextConfig } from "next";
import { hostDe } from "./src/lib/url";

// Una variable mal escrita no debe impedir que el sitio compile: si no se
// puede interpretar, las imágenes de Supabase simplemente no se optimizan.
const host = hostDe(process.env.SUPABASE_URL);

if (process.env.SUPABASE_URL && !host) {
  console.warn(
    "[next.config] SUPABASE_URL no se pudo interpretar como URL. " +
      "Las imágenes de Supabase no se optimizarán. Valor esperado: https://<ref>.supabase.co",
  );
}

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
      { source: "/admin/trabajos-recientes/:path*", destination: "/admin/obras/:path*", permanent: false },
      { source: "/admin/series/:path*", destination: "/admin/exposiciones/:path*", permanent: false },
    ];
  },
  images: {
    // Las obras se sirven desde Supabase Storage. next/image las optimiza y
    // genera las versiones para celular y escritorio (spec de imágenes, §08).
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
