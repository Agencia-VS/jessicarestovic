import { Pagina } from "@/components/site/pagina";
import { Portada } from "@/components/site/portada";
import { listarObrasDestacadas, obtenerConfiguracion } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/imagenes-servidor";

// El contenido lo administra Jessica: revalidamos cada 5 minutos para que una
// obra nueva aparezca sola, sin volver a desplegar.
export const revalidate = 300;

/**
 * El Inicio es una imagen de portada y una línea. La foto configurada tiene
 * prioridad; una obra destacada funciona como alternativa inicial.
 */
export default async function InicioPage() {
  const [destacadas, config] = await Promise.all([
    listarObrasDestacadas(1),
    obtenerConfiguracion(),
  ]);
  const destacada = destacadas[0] ?? null;
  const imagen = config.portada_path
    ? {
        src: urlImagen(config.portada_path),
        alt: config.portada_alt ?? "Obra de Jessica Restović",
        ancho: config.portada_ancho,
        alto: config.portada_alto,
      }
    : destacada
      ? {
          src: destacada.imagenUrl,
          alt: destacada.imagen_alt,
          ancho: destacada.imagen_ancho,
          alto: destacada.imagen_alto,
        }
      : null;

  return (
    <Pagina comoTitulo>
      <Portada imagen={imagen} cita={config.cita} />
    </Pagina>
  );
}
