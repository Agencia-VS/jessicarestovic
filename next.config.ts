import type { NextConfig } from "next";
import { hostDe } from "./src/lib/url";

// Una variable mal escrita no debe impedir que el sitio compile: si no se
// puede interpretar, las imágenes de Supabase simplemente no se optimizan.
const host = hostDe(process.env.NEXT_PUBLIC_SUPABASE_URL);

if (process.env.NEXT_PUBLIC_SUPABASE_URL && !host) {
  console.warn(
    "[next.config] NEXT_PUBLIC_SUPABASE_URL no se pudo interpretar como URL. " +
      "Las imágenes de Supabase no se optimizarán. Valor esperado: https://<ref>.supabase.co",
  );
}

const nextConfig: NextConfig = {
  images: {
    // Las obras se sirven desde Supabase Storage. next/image las optimiza y
    // genera las versiones para celular y escritorio (spec de imágenes, §08).
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Server Actions reciben archivos de hasta 15 MB (obra en galería, §08).
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
