import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Las obras se sirven desde Supabase Storage. next/image las optimiza y
    // genera las versiones para celular y escritorio (spec de imágenes, §08).
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Server Actions reciben archivos de hasta 15 MB (obra en galería, §08).
    serverActions: { bodySizeLimit: "16mb" },
  },
};

export default nextConfig;
