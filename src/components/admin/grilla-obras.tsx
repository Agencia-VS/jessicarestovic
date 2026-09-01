"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { urlImagen } from "@/lib/images";
import type { Obra } from "@/lib/data/tipos";
import {
  alternarDestacada,
  alternarPublicada,
  eliminarObra,
  reordenarObras,
} from "@/lib/acciones/obras";
import { Confirmar } from "./confirmar";

interface GrillaObrasProps {
  obras: Obra[];
}

/**
 * Grilla de tarjetas de obra: miniatura, título, serie y estado.
 *
 * El orden se cambia arrastrando la tarjeta a su lugar; al soltar se guarda el
 * orden completo. Nada de escribir números de orden a mano (§07, «Editar una
 * foto existente»).
 */
export function GrillaObras({ obras }: GrillaObrasProps) {
  const [lista, setLista] = useState(obras);
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  // Si el servidor manda una lista nueva (tras crear o borrar), la adoptamos.
  const idsServidor = obras.map((o) => o.id).join(",");
  const [idsVistos, setIdsVistos] = useState(idsServidor);
  if (idsServidor !== idsVistos) {
    setIdsVistos(idsServidor);
    setLista(obras);
  }

  const soltarSobre = (idDestino: string) => {
    if (!arrastrada || arrastrada === idDestino) return;

    const desde = lista.findIndex((o) => o.id === arrastrada);
    const hasta = lista.findIndex((o) => o.id === idDestino);
    if (desde < 0 || hasta < 0) return;

    const nueva = [...lista];
    const [movida] = nueva.splice(desde, 1);
    if (movida) nueva.splice(hasta, 0, movida);

    setLista(nueva);
    setArrastrada(null);
    iniciar(() => reordenarObras(nueva.map((o) => o.id)));
  };

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map((obra) => (
        <li
          key={obra.id}
          draggable
          onDragStart={() => setArrastrada(obra.id)}
          onDragEnd={() => setArrastrada(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => soltarSobre(obra.id)}
          className={`flex cursor-grab flex-col gap-3 border border-line p-3 transition-opacity active:cursor-grabbing ${
            arrastrada === obra.id ? "opacity-40" : ""
          }`}
        >
          <Link href={`/admin/obras/${obra.id}`} className="flex flex-col gap-3">
            <div className="flex h-44 items-center justify-center bg-line-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlImagen(obra.imagen_path)}
                alt={obra.imagen_alt}
                className="max-h-44 w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[0.9375rem] leading-snug text-ink">{obra.titulo}</span>
              <span className="caption text-muted">
                {obra.serie?.nombre ?? "Sin serie"}
              </span>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-soft pt-2.5">
            <div className="flex gap-3">
              <BotonEstado
                activo={obra.publicada}
                textoActivo="Publicada"
                textoInactivo="Oculta"
                onCambiar={() => iniciar(() => alternarPublicada(obra.id, !obra.publicada))}
              />
              <BotonEstado
                activo={obra.destacada}
                textoActivo="En Inicio"
                textoInactivo="No destacada"
                onCambiar={() => iniciar(() => alternarDestacada(obra.id, !obra.destacada))}
              />
            </div>

            <Confirmar
              nombre={obra.titulo}
              accion={() => iniciar(() => eliminarObra(obra.id))}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function BotonEstado({
  activo,
  textoActivo,
  textoInactivo,
  onCambiar,
}: {
  activo: boolean;
  textoActivo: string;
  textoInactivo: string;
  onCambiar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCambiar}
      aria-pressed={activo}
      className={`caption transition-colors ${
        activo ? "text-ink" : "text-faint hover:text-muted"
      }`}
    >
      {activo ? `● ${textoActivo}` : `○ ${textoInactivo}`}
    </button>
  );
}
