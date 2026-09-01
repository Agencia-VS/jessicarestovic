"use client";

interface OpcionFiltro {
  slug: string;
  nombre: string;
}

interface FiltroSeriesProps {
  opciones: OpcionFiltro[];
  activo: string;
  onCambiar: (slug: string) => void;
}

/** Slug de la opción «Todas». */
export const TODAS = "todas";

/**
 * Filtro por serie. Es la estructura que aporta la dirección B —la serie como
 * eje— resuelta como una fila de versalitas: filtra al instante, sin recargar.
 */
export function FiltroSeries({ opciones, activo, onCambiar }: FiltroSeriesProps) {
  return (
    <div className="gutter overflow-x-auto pt-8" role="group" aria-label="Filtrar por serie">
      <div className="flex gap-6 whitespace-nowrap pb-1">
        {[{ slug: TODAS, nombre: "Todas" }, ...opciones].map(({ slug, nombre }) => {
          const seleccionado = slug === activo;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onCambiar(slug)}
              aria-pressed={seleccionado}
              className={`eyebrow border-b pb-1 transition-colors ${
                seleccionado
                  ? "border-ink text-ink"
                  : "border-transparent text-faint hover:text-ink"
              }`}
            >
              {nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
