"use client";

import Image from "next/image";
import { useState } from "react";
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
  /**
   * Dónde se apoya la foto cuando sobra espacio en su marco.
   *
   * Una obra vertical en un marco ancho queda centrada, y entonces su borde no
   * coincide con el margen de la página ni con el título que lleva encima. Con
   * `izquierda` se apoya en el margen y la columna se lee alineada.
   */
  anclaje?: "centro" | "izquierda";
  /**
   * Qué parte de una foto recortada se ve, de 0 (arriba) a 100 (abajo): la
   * foto grande del Inicio, que Jessica encuadra desde el panel.
   */
  foco?: number;
  /** La primera foto visible se pide antes que el resto (LCP). */
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
 * costados no se ve (§08 «Por qué no se recorta la obra»). La proporción queda
 * también en `--r`, para topar el ancho del marco por su alto
 * —`calc(alto * var(--r))`— sin que el marco quede más ancho que la foto.
 *
 * **Aparece entera.** Mientras llega, el marco muestra el tono del hueco; cuando
 * terminó de llegar, la foto entra con un fundido. Antes el navegador la iba
 * pintando a franjas, de arriba abajo, y la obra se veía cortada mientras
 * cargaba. El fundido lo hace `globals.css` cuando el marco tiene
 * `data-cargada`, y esa marca la pone el script de `layout.tsx` en cuanto la
 * foto está lista, aunque React todavía no haya tomado la página.
 *
 * **Llega al tamaño en que se ve.** Pasa por el optimizador de imágenes, que
 * la entrega reducida y en AVIF o WebP: una miniatura pesa kilobytes y no el
 * original de 3000 px que se descargaba antes para mostrarla a 128. Si el
 * optimizador falla —estuvo apagado un tiempo porque respondía 400—, la foto
 * se pide directo a Storage: una foto pesada que se ve vale más que una
 * liviana que no.
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
  anclaje = "centro",
  foco,
  prioridad = false,
  className = "",
}: FotoProps) {
  /** La foto que el optimizador no pudo entregar y se pide tal cual. */
  const [directa, setDirecta] = useState<string | null>(null);

  const ratio =
    proporcionFija ??
    (variante === "mosaico" ? proporcionEnMosaico(ancho, alto) : proporcion(ancho, alto));

  return (
    <div
      // Otra foto es otro marco: sin la marca de la anterior, vuelve a entrar
      // con su fundido.
      key={src}
      data-foto
      // El script del layout marca el marco cuando la foto llega, y eso puede
      // pasar antes de que React tome la página.
      suppressHydrationWarning
      className={`relative ${className}`}
      style={{ aspectRatio: ratio, "--r": ratio } as React.CSSProperties}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={prioridad ? "eager" : undefined}
        fetchPriority={prioridad ? "high" : undefined}
        unoptimized={directa === src}
        onError={() => setDirecta(src)}
        // Respaldo del script del layout, por si no corrió: sin la marca, la
        // foto quedaría escondida. `next/image` avisa también de las que
        // llegaron antes de la hidratación; una rota no tiene ancho.
        onLoad={(evento) => {
          const imagen = evento.currentTarget;
          if (imagen.naturalWidth > 0) imagen.parentElement?.setAttribute("data-cargada", "");
        }}
        style={foco === undefined ? undefined : { objectPosition: `50% ${foco}%` }}
        className={`${encuadre === "recortada" ? "object-cover" : "object-contain"} ${
          anclaje === "izquierda" ? "object-left" : ""
        }`}
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
