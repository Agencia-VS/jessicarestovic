import type { MetadataRoute } from "next";
import { listarExposiciones, listarTrabajos } from "@/lib/data/consultas";
import { navPublica } from "@/lib/site-config";
import { urlDelSitio } from "@/lib/entorno";

/**
 * Como las páginas, se arma en cada pedido. Es una ruta aparte y no hereda la
 * declaración del layout: sin esta línea, un build que no viera Supabase lo
 * dejaba fijo con los grupos del contenido de referencia.
 */
export const dynamic = "force-dynamic";

/**
 * El mapa del sitio incluye las páginas de cada grupo —muestras y conjuntos de
 * trabajo— y las de obras, que no están en el menú: se llega a ellas
 * navegando, pero cada una tiene su dirección y conviene que el buscador las
 * encuentre.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const [exposiciones, trabajos] = await Promise.all([
    listarExposiciones(),
    listarTrabajos(),
  ]);

  // La portada ya va aparte más abajo; sin este filtro aparecería dos veces,
  // porque «Inicio» entró al menú al retirarse la firma de la cabecera.
  const fijas = [
    "/privacidad",
    ...navPublica.map(({ href }) => href).filter((href) => href !== "/"),
  ];

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
    ...trabajos.map(({ slug, actualizado_en }) => ({
      url: `${urlDelSitio()}/trabajos/${slug}`,
      lastModified: actualizado_en ? new Date(actualizado_en) : ahora,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
