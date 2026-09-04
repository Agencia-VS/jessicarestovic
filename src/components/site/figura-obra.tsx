"use client";

import type { Obra } from "@/lib/data/tipos";
import { Foto } from "./foto";

/** Ancho que ocupa una obra del mosaico en cada tamaño de pantalla. */
export const SIZES_MOSAICO = "(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 330px";

/** Los datos de ficha que existan, en el orden del canvas. */
export function fichaDe(obra: Obra): string {
  return [obra.anio, obra.tecnica, obra.dimensiones].filter(Boolean).join(" · ");
}

interface FiguraObraProps {
  obra: Obra;
  /** Lo que va bajo el título: la serie en la retícula, la ficha en la serie. */
  pie: string;
  onAbrir: () => void;
  prioridad?: boolean;
}

/**
 * Una obra del mosaico: la foto, el título en serif y una línea de apoyo.
 *
 * `break-inside: avoid` es lo que sostiene el mosaico — la figura no se puede
 * partir entre dos columnas.
 */
export function FiguraObra({ obra, pie, onAbrir, prioridad = false }: FiguraObraProps) {
  return (
    <figure className="mb-[clamp(1.875rem,3.8vw,3.875rem)] break-inside-avoid">
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ver ${obra.titulo} en grande`}
        className="group flex w-full cursor-zoom-in flex-col gap-3 text-left"
      >
        <Foto
          path={obra.imagen_path}
          alt={obra.imagen_alt}
          ancho={obra.imagen_ancho}
          alto={obra.imagen_alto}
          sizes={SIZES_MOSAICO}
          prioridad={prioridad}
          className="w-full"
        />
        <figcaption className="flex flex-col gap-1">
          <span className="self-start border-b border-transparent font-display text-[1.0625rem] leading-tight font-light transition-colors group-hover:border-accent">
            {obra.titulo}
          </span>
          {pie && <span className="pie text-faint">{pie}</span>}
        </figcaption>
      </button>
    </figure>
  );
}
