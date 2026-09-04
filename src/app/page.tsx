import { Pagina } from "@/components/site/pagina";
import { Portada } from "@/components/site/portada";
import { listarObrasDestacadas, obtenerConfiguracion } from "@/lib/data/consultas";

// El contenido lo administra Jessica: revalidamos cada 5 minutos para que una
// obra nueva aparezca sola, sin volver a desplegar.
export const revalidate = 300;

/**
 * El Inicio es una imagen de portada y una línea. La obra se entra por
 * «Exposiciones», que es la puerta que quedó en el diseño.
 */
export default async function InicioPage() {
  const [destacadas, config] = await Promise.all([
    listarObrasDestacadas(1),
    obtenerConfiguracion(),
  ]);

  return (
    <Pagina comoTitulo>
      <Portada obra={destacadas[0] ?? null} cita={config.cita} />
    </Pagina>
  );
}
