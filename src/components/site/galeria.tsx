"use client";

import { useMemo, useState } from "react";
import type { SerieConObras } from "@/lib/data/tipos";
import { FiltroSeries, TODAS } from "./filtro-series";
import { ReticulaObras } from "./reticula-obras";
import { Lightbox } from "./lightbox";
import { EstadoVacio } from "@/components/ui/estado-vacio";

interface GaleriaProps {
  grupos: SerieConObras[];
}

/**
 * La galería de `/obra`: obras agrupadas por serie, con el filtro arriba y la
 * vista ampliada en capa.
 *
 * El lightbox recorre la lista *visible*, así que si el visitante filtró por
 * una serie, las flechas se mueven solo dentro de esa serie.
 */
export function Galeria({ grupos }: GaleriaProps) {
  const [serieActiva, setSerieActiva] = useState<string>(TODAS);
  const [abierta, setAbierta] = useState<number | null>(null);

  const opciones = useMemo(
    () => grupos.map(({ slug, nombre }) => ({ slug, nombre })),
    [grupos],
  );

  const visibles = useMemo(
    () => (serieActiva === TODAS ? grupos : grupos.filter((g) => g.slug === serieActiva)),
    [grupos, serieActiva],
  );

  // Lista plana en el mismo orden en que se ven, para navegar con las flechas.
  const obrasVisibles = useMemo(() => visibles.flatMap((grupo) => grupo.obras), [visibles]);

  // Índice en que empieza cada grupo dentro de `obrasVisibles`, para que al
  // abrir una obra el lightbox arranque en la correcta.
  const inicios = useMemo(
    () =>
      visibles.map((_, indice) =>
        visibles.slice(0, indice).reduce((total, grupo) => total + grupo.obras.length, 0),
      ),
    [visibles],
  );

  const cambiarSerie = (slug: string) => {
    setSerieActiva(slug);
    setAbierta(null);
  };

  if (grupos.length === 0) {
    return (
      <div className="gutter pt-12">
        <EstadoVacio
          titulo="Todavía no hay obras publicadas"
          detalle="Cuando Jessica suba su primera obra desde el panel, aparecerá acá agrupada por serie."
        />
      </div>
    );
  }

  return (
    <>
      <FiltroSeries opciones={opciones} activo={serieActiva} onCambiar={cambiarSerie} />

      <div className="gutter flex flex-col gap-22 pt-18 pb-8">
        {visibles.map((grupo, indiceGrupo) => {
          return (
            <section key={grupo.id} aria-labelledby={`serie-${grupo.slug}`}>
              <div className="flex items-baseline justify-between gap-8 border-b border-line pb-3.5">
                <h2 id={`serie-${grupo.slug}`} className="text-[1.3125rem] tracking-[0.01em]">
                  {grupo.nombre}
                </h2>
                <p className="caption tracking-[0.08em] text-muted">
                  {grupo.obras.length} {grupo.obras.length === 1 ? "pieza" : "piezas"}
                  {grupo.descripcion ? ` · ${grupo.descripcion.replace(/\.$/, "")}` : ""}
                </p>
              </div>

              <div className="pt-7.5">
                <ReticulaObras
                  obras={grupo.obras}
                  offset={inicios[indiceGrupo] ?? 0}
                  onAbrir={setAbierta}
                  primeraPrioritaria={indiceGrupo === 0}
                />
              </div>
            </section>
          );
        })}
      </div>

      <Lightbox
        obras={obrasVisibles}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </>
  );
}
