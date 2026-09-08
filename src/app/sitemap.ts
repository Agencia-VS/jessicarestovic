import type { MetadataRoute } from "next";
import { listarExposiciones, listarSeries } from "@/lib/data/consultas";
import { navPublica, siteConfig } from "@/lib/site-config";

/**
 * El mapa del sitio incluye las páginas de serie y de exposición, que no están
 * en el menú: se llega a ellas navegando, pero cada una tiene su dirección y
 * conviene que el buscador las encuentre.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const [series, exposiciones] = await Promise.all([listarSeries(), listarExposiciones()]);

  const fijas = ["/privacidad", ...navPublica.map(({ href }) => href)];

  return [
    { url: siteConfig.url, lastModified: ahora, changeFrequency: "monthly", priority: 1 },
    ...fijas.map((href) => ({
      url: `${siteConfig.url}${href}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: href === "/privacidad" ? 0.2 : 0.8,
    })),
    ...exposiciones.map(({ slug, actualizado_en }) => ({
      url: `${siteConfig.url}/exposiciones/${slug}`,
      lastModified: actualizado_en ? new Date(actualizado_en) : ahora,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...series.map(({ slug, actualizado_en }) => ({
      url: `${siteConfig.url}/serie/${slug}`,
      lastModified: actualizado_en ? new Date(actualizado_en) : ahora,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
