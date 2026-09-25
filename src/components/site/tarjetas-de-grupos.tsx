import Link from "next/link";
import type { Exposicion } from "@/lib/data/tipos";
import { Foto, Hueco } from "./foto";

/** Ancho que ocupa una tarjeta del mosaico en cada tamaño de pantalla. */
const SIZES_MOSAICO = "(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 330px";

interface TarjetasDeGruposProps {
  grupos: Exposicion[];
  /** A dónde lleva cada tarjeta. */
  hrefDe: (grupo: Exposicion) => string;
  /** Los conjuntos de trabajo no tienen lugar ni año que mostrar. */
  conLugar?: boolean;
}

/**
 * El índice de grupos: una imagen por grupo y su nombre.
 *
 * Lo comparten «Exposiciones» y «Trabajos» porque son la misma tarjeta: un
 * grupo de obras con nombre. Mostrar las 85 vistas de una vez habría sido
 * ruido, así que cada tarjeta se ilustra con una sola imagen —la primera vista
 * de sala, y si no hay, la primera obra.
 *
 * Bajo el nombre va el lugar y el año de una muestra, si los tiene, y nada
 * más: la tarjeta no cuenta fotos ni obras, porque el sitio no enumera.
 */
export function TarjetasDeGrupos({ grupos, hrefDe, conLugar = true }: TarjetasDeGruposProps) {
  return (
    <div className="mosaico">
      {grupos.map((grupo, indice) => {
        const lugar = conLugar ? [grupo.lugar, grupo.anio].filter(Boolean).join(" · ") : "";

        return (
          <figure key={grupo.id} className="mb-[clamp(1.875rem,3.8vw,3.875rem)] break-inside-avoid">
            <Link href={hrefDe(grupo)} className="group flex flex-col gap-3">
              {grupo.portada ? (
                <Foto
                  src={grupo.portada.src}
                  alt={grupo.portada.alt}
                  ancho={grupo.portada.ancho}
                  alto={grupo.portada.alto}
                  sizes={SIZES_MOSAICO}
                  prioridad={indice === 0}
                  className="w-full"
                />
              ) : (
                <Hueco proporcion={3 / 2} etiqueta={`Sin fotos de ${grupo.titulo} todavía`} />
              )}

              <figcaption className="flex flex-col gap-1">
                <span className="self-start border-b border-transparent font-display text-[1.0625rem] leading-tight font-light transition-colors group-hover:border-accent">
                  {grupo.titulo}
                </span>
                {lugar && <span className="pie text-faint">{lugar}</span>}
              </figcaption>
            </Link>
          </figure>
        );
      })}
    </div>
  );
}
