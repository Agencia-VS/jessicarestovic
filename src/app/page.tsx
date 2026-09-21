import { Pagina } from "@/components/site/pagina";
import { Portada } from "@/components/site/portada";
import { listarObrasDestacadas, obtenerConfiguracion } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/imagenes-servidor";
import { CELDAS_PORTADA, siteConfig } from "@/lib/site-config";

// El contenido lo administra Jessica: revalidamos cada 5 minutos para que una
// obra nueva aparezca sola, sin volver a desplegar.
export const revalidate = 300;

/**
 * El Inicio es un tríptico de tres fotos y una línea.
 *
 * Las fotos que Jessica sube en «Inicio» del panel tienen prioridad. Mientras
 * no haya subido ninguna, el tríptico se arma con las obras marcadas como
 * destacadas, así el Inicio nunca se ve vacío recién montado.
 */
export default async function InicioPage() {
  const [destacadas, config] = await Promise.all([
    listarObrasDestacadas(CELDAS_PORTADA),
    obtenerConfiguracion(),
  ]);

  const imagenes =
    config.portadas.length > 0
      ? config.portadas.map(({ path, alt, ancho, alto }) => ({
          src: urlImagen(path),
          alt: alt ?? `Obra de ${siteConfig.nombre}`,
          ancho,
          alto,
        }))
      : destacadas.map((obra) => ({
          src: obra.imagenUrl,
          alt: obra.imagen_alt,
          ancho: obra.imagen_ancho,
          alto: obra.imagen_alto,
        }));

  return (
    <Pagina>
      {/* El `<h1>` lo aportaba la firma de la cabecera, que se retiró. La
          portada es obra y una frase, así que el encabezado va acá, visible
          para buscadores y lectores de pantalla y no para el diseño. */}
      <h1 className="sr-only">
        {siteConfig.nombre} — {siteConfig.rol}
      </h1>
      <Portada imagenes={imagenes} cita={config.cita} />
    </Pagina>
  );
}
