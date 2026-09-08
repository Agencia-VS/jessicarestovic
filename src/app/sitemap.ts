import type { MetadataRoute } from "next";
import { listarExposiciones } from "@/lib/data/consultas";
import { navPublica } from "@/lib/site-config";
import { urlDelSitio } from "@/lib/entorno";

/**
 * El mapa del sitio incluye las páginas de obras y de exposición, que no están
 * en el menú: se llega a ellas navegando, pero cada una tiene su dirección y
 * conviene que el buscador las encuentre.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const exposiciones = await listarExposiciones();

  const fijas = ["/privacidad", ...navPublica.map(({ href }) => href)];

  return [
    { url: urlDelSitio(), lastModified: ahora, changeFrequency: "monthly", priority: 1 },
    ...fijas.map((href) => ({
      url: `${urlDelSitio()}${href}`,
      lastModified: ahora,
      changeFrequency: "monthly" as const,
      priority: href === "/privacidad" ? 0.2 : 0.8,
    })),
    ...exposiciones.map(({ slug, actualizado_en }) => ({
      url: `${urlDelSitio()}/exposiciones/${slug}`,
      lastModified: actualizado_en ? new Date(actualizado_en) : ahora,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...exposiciones.map(({ slug, actualizado_en }) => ({
      url: `${urlDelSitio()}/exposiciones/${slug}/obras`,
      lastModified: actualizado_en ? new Date(actualizado_en) : ahora,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
