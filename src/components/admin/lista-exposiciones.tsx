"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  alternarExposicionPublicada,
  eliminarExposicion,
  reordenarExposiciones,
} from "@/lib/acciones/exposiciones";
import { Confirmar } from "./confirmar";
import type { Exposicion } from "@/lib/data/tipos";

/** Lista reordenable de exposiciones, con lugar, año y contenido a la vista. */
export function ListaExposiciones({ exposiciones }: { exposiciones: Exposicion[] }) {
  const [lista, setLista] = useState(exposiciones);
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  const idsServidor = exposiciones.map((exposicion) => exposicion.id).join(",");
  const [idsVistos, setIdsVistos] = useState(idsServidor);
  if (idsServidor !== idsVistos) {
    setIdsVistos(idsServidor);
    setLista(exposiciones);
  }

  const soltarSobre = (idDestino: string) => {
    if (!arrastrada || arrastrada === idDestino) return;
    const desde = lista.findIndex((expo) => expo.id === arrastrada);
    const hasta = lista.findIndex((expo) => expo.id === idDestino);
    if (desde < 0 || hasta < 0) return;

    const nueva = [...lista];
    const [movida] = nueva.splice(desde, 1);
    if (movida) nueva.splice(hasta, 0, movida);
    setLista(nueva);
    setArrastrada(null);
    iniciar(() => reordenarExposiciones(nueva.map((expo) => expo.id)));
  };

  return (
    <ul className="border-t border-line">
      {lista.map((expo) => (
        <li
          key={expo.id}
          draggable
          onDragStart={() => setArrastrada(expo.id)}
          onDragEnd={() => setArrastrada(null)}
          onDragOver={(evento) => evento.preventDefault()}
          onDrop={() => soltarSobre(expo.id)}
          className={`cursor-grab border-b border-line py-5 active:cursor-grabbing ${
            arrastrada === expo.id ? "opacity-40" : ""
          }`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <Link href={`/admin/exposiciones/${expo.id}`} className="flex flex-col gap-0.5">
              <span className="text-[1.0625rem] leading-snug">{expo.titulo}</span>
              <span className="caption text-muted">
                {[expo.lugar, expo.anio ? String(expo.anio) : null]
                  .filter(Boolean)
                  .join(" · ") || "Sin lugar ni año"}
                {expo.fotos.length > 0 &&
                  ` · ${expo.fotos.length} ${expo.fotos.length === 1 ? "foto" : "fotos"}`}
                {` · ${expo.obrasPublicadas} ${expo.obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}`}
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => iniciar(() => alternarExposicionPublicada(expo.id, !expo.publicada))}
                aria-pressed={expo.publicada}
                className={`caption transition-colors ${
                  expo.publicada ? "text-ink" : "text-faint hover:text-muted"
                }`}
              >
                {expo.publicada ? "● Publicada" : "○ Oculta"}
              </button>

              <Confirmar
                nombre={expo.titulo}
                accion={() => iniciar(() => eliminarExposicion(expo.id))}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
