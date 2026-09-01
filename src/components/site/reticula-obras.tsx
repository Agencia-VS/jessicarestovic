"use client";

import type { Obra } from "@/lib/data/tipos";
import { ObraImagen } from "./obra-imagen";
import { ObraPie } from "./obra-pie";

/** Ancho que ocupa una obra de la retícula en cada tamaño de pantalla. */
const SIZES_RETICULA = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

interface ReticulaObrasProps {
  obras: Obra[];
  /** Índice global de la primera obra, para abrir el lightbox en la correcta. */
  offset: number;
  onAbrir: (indice: number) => void;
  /** Marca la primera obra de la página como prioritaria para el LCP. */
  primeraPrioritaria?: boolean;
}

/**
 * Retícula de obras: tres columnas en escritorio, una en móvil.
 *
 * Las alturas son distintas a propósito —cada pieza conserva su proporción
 * real— y las filas se alinean arriba, como en el mockup. Nada de recortar a
 * cuadrado para que «calce».
 */
export function ReticulaObras({
  obras,
  offset,
  onAbrir,
  primeraPrioritaria = false,
}: ReticulaObrasProps) {
  return (
    <ul className="grid grid-cols-1 items-start gap-x-9 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
      {obras.map((obra, i) => (
        <li key={obra.id}>
          <button
            type="button"
            onClick={() => onAbrir(offset + i)}
            className="group flex w-full cursor-zoom-in flex-col gap-3 text-left"
            aria-label={`Ver ${obra.titulo} en grande`}
          >
            <figure className="flex flex-col gap-3">
              <ObraImagen
                obra={obra}
                sizes={SIZES_RETICULA}
                prioridad={primeraPrioritaria && i === 0}
                className="transition-opacity group-hover:opacity-88"
              />
              <ObraPie obra={obra} />
            </figure>
          </button>
        </li>
      ))}
    </ul>
  );
}
