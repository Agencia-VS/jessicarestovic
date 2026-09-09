"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
  /**
   * El encabezado con el nombre del grupo. Se omite cuando la grilla ya vive
   * dentro de la página de ese grupo y el nombre está arriba.
   */
  conEncabezado?: boolean;
}

/**
 * Grilla de obras. Las tarjetas se agrupan por grupo y el arrastre solo
 * escribe el orden dentro de ese grupo, que es donde se consume.
 */
export function GrillaObras({ obras, conEncabezado = true }: GrillaObrasProps) {
  const [lista, setLista] = useState(obras);
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  const firmaServidor = obras.map((obra) => `${obra.id}:${obra.orden}`).join(",");
  const [firmaVista, setFirmaVista] = useState(firmaServidor);
  if (firmaServidor !== firmaVista) {
    setFirmaVista(firmaServidor);
    setLista(obras);
  }

  const soltarSobre = (idDestino: string) => {
    if (!arrastrada || arrastrada === idDestino) return;

    const origen = lista.find((obra) => obra.id === arrastrada);
    const destino = lista.find((obra) => obra.id === idDestino);
    if (!origen || !destino || origen.exposicion_id !== destino.exposicion_id) return;

    const grupo = lista.filter((obra) => obra.exposicion_id === origen.exposicion_id);
    const desde = grupo.findIndex((obra) => obra.id === arrastrada);
    const hasta = grupo.findIndex((obra) => obra.id === idDestino);
    if (desde < 0 || hasta < 0) return;

    const reordenado = [...grupo];
    const [movida] = reordenado.splice(desde, 1);
    if (movida) reordenado.splice(hasta, 0, movida);

    const indices = lista
      .map((obra, indice) => (obra.exposicion_id === origen.exposicion_id ? indice : -1))
      .filter((indice) => indice >= 0);
    const nueva = [...lista];
    indices.forEach((indice, posicion) => {
      nueva[indice] = reordenado[posicion]!;
    });

    setLista(nueva);
    setArrastrada(null);
    iniciar(() => reordenarObras(reordenado.map((obra) => obra.id)));
  };

  const grupos = new Map<string, { titulo: string; obras: Obra[] }>();
  for (const obra of lista) {
    const clave = obra.exposicion_id ?? "sin-exposicion";
    const grupo = grupos.get(clave);
    if (grupo) grupo.obras.push(obra);
    else grupos.set(clave, { titulo: obra.exposicion?.titulo ?? "Sin exposición", obras: [obra] });
  }

  return (
    <div className="flex flex-col gap-12">
      {[...grupos.values()].map((grupo) => (
        <section key={grupo.titulo} className="flex flex-col gap-5">
          {conEncabezado && (
            <h2 className="font-display text-[clamp(1.5rem,2.8vw,2.25rem)] leading-tight font-light">
              {grupo.titulo}
            </h2>
          )}
          <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.obras.map((obra) => (
              <li
                key={obra.id}
                draggable
                onDragStart={() => setArrastrada(obra.id)}
                onDragEnd={() => setArrastrada(null)}
                onDragOver={(evento) => evento.preventDefault()}
                onDrop={() => soltarSobre(obra.id)}
                className={`flex cursor-grab flex-col gap-3 border border-line p-3 transition-opacity active:cursor-grabbing ${
                  arrastrada === obra.id ? "opacity-40" : ""
                }`}
              >
                <Link href={`/admin/obras/${obra.id}`} className="flex flex-col gap-3">
                  <div className="flex h-44 items-center justify-center bg-line-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={obra.imagenUrl}
                      alt={obra.imagen_alt}
                      className="max-h-44 w-auto max-w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[0.9375rem] leading-snug text-ink">{obra.titulo}</span>
                    <span className="caption text-muted">
                      {obra.conjunto ?? "Sin conjunto"}
                      {!obra.publicada && " · Oculta"}
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
        </section>
      ))}
    </div>
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
