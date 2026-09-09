import Image from "next/image";
import { proporcion, proporcionEnMosaico } from "@/lib/images";

interface FotoProps {
  /** URL pública ya resuelta por la capa de datos del servidor. */
  src: string;
  alt: string;
  ancho: number | null;
  alto: number | null;
  /** `sizes` de `next/image`, según el ancho que ocupa en cada layout. */
  sizes: string;
  /**
   * `mosaico` aplica el tope de altura de la retícula; `exacta` respeta la
   * proporción tal cual, para la portada y la vista ampliada.
   */
  variante?: "mosaico" | "exacta";
  /**
   * Marco de proporción fija, que ignora la de la foto — los cuadrados del
   * tríptico de portada.
   */
  proporcionFija?: number;
  /**
   * `contenida` es la regla del sitio: la obra entra completa en su marco y
   * nunca se recorta (§08). `recortada` es la excepción del tríptico del
   * Inicio, donde lo que se busca son tres cuadrados llenos e iguales; ahí la
   * foto completa está a un toque, en la vista ampliada.
   */
  encuadre?: "contenida" | "recortada";
  /** La primera foto visible se carga con prioridad (LCP). */
  prioridad?: boolean;
  /** Las clases que fijan el tamaño del marco: `w-full` en la retícula. */
  className?: string;
}

/**
 * Una foto en su proporción real.
 *
 * El `aspect-ratio` sale de las medidas guardadas al subirla, así el espacio
 * queda reservado antes de que cargue y la página no salta. Nunca se recorta:
 * `object-contain` sobre el mismo fondo del sitio, de modo que el aire de los
 * costados no se ve (§08 «Por qué no se recorta la obra»).
 */
export function Foto({
  src,
  alt,
  ancho,
  alto,
  sizes,
  variante = "mosaico",
  proporcionFija,
  encuadre = "contenida",
  prioridad = false,
  className = "",
}: FotoProps) {
  const ratio =
    proporcionFija ??
    (variante === "mosaico" ? proporcionEnMosaico(ancho, alto) : proporcion(ancho, alto));

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: ratio }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={prioridad}
        className={encuadre === "recortada" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}

/**
 * El hueco de una foto que todavía no existe. Aparece cuando una sección está
 * publicada pero sin imagen cargada: mejor un tono plano en su proporción que
 * un salto de layout cuando la foto llegue.
 */
export function Hueco({
  proporcion: ratio = 4 / 5,
  etiqueta,
  className = "",
}: {
  proporcion?: number;
  etiqueta: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={etiqueta}
      className={`w-full bg-line-soft ${className}`}
      style={{ aspectRatio: ratio }}
    />
  );
}
