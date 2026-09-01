"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Campo, Area } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { Confirmar } from "./confirmar";
import { INICIAL } from "@/lib/acciones/resultado";
import { crearSerie, editarSerie, eliminarSerie, reordenarSeries } from "@/lib/acciones/series";
import type { Serie } from "@/lib/data/tipos";

/** Lista simple para crear una serie nueva o renombrar una existente (§07). */
export function ListaSeries({ series }: { series: Serie[] }) {
  const [resultado, accionCrear, creando] = useActionState(crearSerie, INICIAL);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [orden, setOrden] = useState(series);
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  const idsServidor = series.map((s) => s.id).join(",");
  const [idsVistos, setIdsVistos] = useState(idsServidor);
  if (idsServidor !== idsVistos) {
    setIdsVistos(idsServidor);
    setOrden(series);
  }

  const soltarSobre = (idDestino: string) => {
    if (!arrastrada || arrastrada === idDestino) return;
    const desde = orden.findIndex((s) => s.id === arrastrada);
    const hasta = orden.findIndex((s) => s.id === idDestino);
    if (desde < 0 || hasta < 0) return;

    const nueva = [...orden];
    const [movida] = nueva.splice(desde, 1);
    if (movida) nueva.splice(hasta, 0, movida);

    setOrden(nueva);
    setArrastrada(null);
    iniciar(() => reordenarSeries(nueva.map((s) => s.id)));
  };

  return (
    <div className="flex flex-col gap-12">
      <Aviso resultado={resultado} />

      {orden.length > 0 && (
        <ul className="border-t border-line">
          {orden.map((serie) => (
            <li
              key={serie.id}
              draggable={editandoId !== serie.id}
              onDragStart={() => setArrastrada(serie.id)}
              onDragEnd={() => setArrastrada(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltarSobre(serie.id)}
              className={`border-b border-line py-4 ${
                arrastrada === serie.id ? "opacity-40" : ""
              } ${editandoId === serie.id ? "" : "cursor-grab active:cursor-grabbing"}`}
            >
              {editandoId === serie.id ? (
                <FormularioSerie serie={serie} onListo={() => setEditandoId(null)} />
              ) : (
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[1.0625rem] leading-snug">{serie.nombre}</span>
                    <span className="caption text-muted">
                      {serie.obrasPublicadas}{" "}
                      {serie.obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}
                      {serie.descripcion ? ` · ${serie.descripcion}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setEditandoId(serie.id)}
                      className="caption text-muted transition-colors hover:text-ink"
                    >
                      Renombrar
                    </button>
                    <Confirmar
                      nombre={serie.nombre}
                      accion={() => iniciar(() => eliminarSerie(serie.id))}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={accionCrear} className="flex max-w-lg flex-col gap-6 border-t border-line pt-8">
        <h2 className="eyebrow text-label">Crear una serie</h2>
        <Campo etiqueta="Nombre" nombre="nombre" requerido error={resultado.errores?.nombre} />
        <Area
          etiqueta="Descripción"
          nombre="descripcion"
          rows={2}
          error={resultado.errores?.descripcion}
          ayuda="Aparece junto al nombre de la serie en la galería."
        />
        <Boton type="submit" cargando={creando} className="self-start">
          Crear serie
        </Boton>
      </form>
    </div>
  );
}

/** Renombrar una serie en la misma línea de la lista. */
function FormularioSerie({ serie, onListo }: { serie: Serie; onListo: () => void }) {
  const [resultado, accion, guardando] = useActionState(
    editarSerie.bind(null, serie.id),
    INICIAL,
  );

  // Cerrar la edición en línea cuando el guardado salió bien.
  useEffect(() => {
    if (resultado.estado === "ok") onListo();
  }, [resultado.estado, onListo]);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo
        etiqueta="Nombre"
        nombre="nombre"
        requerido
        defaultValue={serie.nombre}
        error={resultado.errores?.nombre}
      />
      <Area
        etiqueta="Descripción"
        nombre="descripcion"
        rows={2}
        defaultValue={serie.descripcion ?? ""}
        error={resultado.errores?.descripcion}
      />
      <div className="flex gap-3">
        <Boton type="submit" cargando={guardando}>
          Guardar
        </Boton>
        <Boton type="button" variante="secundario" onClick={onListo}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
