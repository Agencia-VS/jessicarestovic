import Link from "next/link";
import type { Exposicion } from "@/lib/data/tipos";
import { Foto, Hueco } from "./foto";
import { SIZES_MOSAICO } from "./figura-obra";

interface TarjetasDeGruposProps {
  grupos: Exposicion[];
  /** A dónde lleva cada tarjeta. */
  hrefDe: (grupo: Exposicion) => string;
  /**
   * Qué cuenta el pie. Una muestra lleva a sus vistas de sala, así que cuenta
   * vistas; un conjunto de trabajo lleva directo a sus obras.
   */
  cuenta: "vistas" | "obras";
  /** Los conjuntos de trabajo no tienen lugar ni año que mostrar. */
  conLugar?: boolean;
}

/**
 * El índice de grupos: una imagen por grupo, con su nombre y su conteo.
 *
 * Lo comparten «Exposiciones» y «Trabajos» porque son la misma tarjeta: un
 * grupo de obras con nombre. Mostrar las 85 vistas de una vez habría sido
 * ruido, así que cada tarjeta se ilustra con una sola imagen —la primera vista
 * de sala, y si no hay, la primera obra.
 */
export function TarjetasDeGrupos({
  grupos,
  hrefDe,
  cuenta,
  conLugar = true,
}: TarjetasDeGruposProps) {
  return (
    <div className="mosaico">
      {grupos.map((grupo, indice) => {
        const total = cuenta === "vistas" ? grupo.fotos.length : grupo.obrasPublicadas;
        const unidad = cuenta === "vistas" ? "imagen" : "obra";
        const lugar = conLugar
          ? [grupo.lugar, grupo.anio].filter(Boolean).join(" · ")
          : "";
        const conteo =
          total > 0 ? `${total} ${total === 1 ? unidad : `${unidad}s`}` : "Sin fotos todavía";

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
                <span className="pie text-faint">
                  {[lugar, conteo].filter(Boolean).join(" · ")}
                </span>
              </figcaption>
            </Link>
          </figure>
        );
      })}
    </div>
  );
}
