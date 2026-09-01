import type { MetadataRoute } from "next";
import { navPublica, siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  return [
    { url: siteConfig.url, lastModified: ahora, changeFrequency: "monthly", priority: 1 },
    ...navPublica.map(({ href }) => ({
      url: `${siteConfig.url}${href}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
