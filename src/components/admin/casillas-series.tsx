"use client";

import { useId } from "react";
import type { Serie } from "@/lib/data/tipos";

interface CasillasSeriesProps {
  series: Serie[];
  /** Ids de las series que ya están marcadas. */
  seleccionadas: string[];
}

/**
 * Las series que expuso una muestra.
 *
 * Casillas y no un desplegable múltiple: se ve de un vistazo qué está marcado
 * y se toca directo, también en el celular. Una muestra puede haber reunido
 * varias —«Ensambles al Cubo» expuso dos— y puede no haber expuesto ninguna
 * serie completa, como «Fundación Guayasamín».
 */
export function CasillasSeries({ series, seleccionadas }: CasillasSeriesProps) {
  const id = useId();
  const marcadas = new Set(seleccionadas);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow text-muted">
        Series que expuso
        <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>
      </legend>

      {series.length === 0 ? (
        <p className="caption text-faint">
          Todavía no hay series. Crea la primera en «Series» y vuelve acá.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {series.map((serie) => (
              <li key={serie.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`${id}-${serie.id}`}
                  name="series"
                  value={serie.id}
                  defaultChecked={marcadas.has(serie.id)}
                  className="mt-0.5 size-4 shrink-0 accent-ink"
                />
                <label htmlFor={`${id}-${serie.id}`} className="flex flex-col gap-0.5">
                  <span className="text-[0.9375rem] text-ink">{serie.nombre}</span>
                  <span className="caption text-muted">
                    {serie.obrasPublicadas}{" "}
                    {serie.obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <p className="caption text-faint">
            Marca todas las que se mostraron. Desde la página de la exposición se podrá
            entrar a cada serie completa, y desde la serie se vuelve acá.
          </p>
        </>
      )}
    </fieldset>
  );
}
