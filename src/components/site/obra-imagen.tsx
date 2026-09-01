import Image from "next/image";
import { proporcion, urlImagen } from "@/lib/images";
import type { Obra } from "@/lib/data/tipos";

interface ObraImagenProps {
  obra: Obra;
  /** `sizes` de `next/image`, según el ancho que ocupa en cada layout. */
  sizes: string;
  /** La primera obra visible se carga con prioridad (LCP). */
  prioridad?: boolean;
  className?: string;
}

/**
 * La foto de una obra, en su proporción real.
 *
 * El `aspect-ratio` viene de las dimensiones guardadas al subir la foto, así
 * que el espacio queda reservado antes de que la imagen cargue y la página no
 * salta. Nunca se recorta: `object-contain` sobre el mismo fondo del sitio
 * (§08 «Por qué no se recorta la obra»).
 */
export function ObraImagen({ obra, sizes, prioridad = false, className = "" }: ObraImagenProps) {
  const ratio = proporcion(obra.imagen_ancho, obra.imagen_alto);

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: ratio }}>
      <Image
        src={urlImagen(obra.imagen_path)}
        alt={obra.imagen_alt}
        fill
        sizes={sizes}
        priority={prioridad}
        className="object-contain"
      />
    </div>
  );
}
