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

interface ListaExposicionesProps {
  exposiciones: Exposicion[];
  /** La sección donde se editan: «/admin/exposiciones» o «/admin/trabajos». */
  base?: string;
  /** Un conjunto de trabajo no tiene lugar ni año que mostrar. */
  conLugar?: boolean;
}

/**
 * Lista reordenable de grupos, con su contenido a la vista.
 *
 * La comparten «Exposiciones» y «Trabajos»: es la misma lista y el mismo
 * arrastre, y cada pestaña ordena solo su propio tipo.
 */
export function ListaExposiciones({
  exposiciones,
  base = "/admin/exposiciones",
  conLugar = true,
}: ListaExposicionesProps) {
  const [lista, setLista] = useState(exposiciones);
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();
  const [aviso, setAviso] = useState("");

  const idsServidor = exposiciones.map((exposicion) => exposicion.id).join(",");
  const [idsVistos, setIdsVistos] = useState(idsServidor);
  if (idsServidor !== idsVistos) {
    setIdsVistos(idsServidor);
    setLista(exposiciones);
  }

  const mover = (desde: number, hasta: number) => {
    if (guardando || desde < 0 || hasta < 0 || hasta >= lista.length || desde === hasta) return;
    const anterior = lista;
    const nueva = [...lista];
    const [movida] = nueva.splice(desde, 1);
    if (!movida) return;
    nueva.splice(hasta, 0, movida);
    setLista(nueva);
    setArrastrada(null);
    setAviso("Guardando orden…");
    iniciar(async () => {
      try {
        const resultado = await reordenarExposiciones(nueva.map((expo) => expo.id), movida.tipo);
        if (resultado.estado !== "ok") setLista(anterior);
        setAviso(resultado.aviso ?? "");
      } catch {
        setLista(anterior);
        setAviso("No se pudo guardar. Se recuperó el orden anterior.");
      }
    });
  };
  const soltarSobre = (idDestino: string) => {
    if (arrastrada) mover(lista.findIndex((e) => e.id === arrastrada), lista.findIndex((e) => e.id === idDestino));
  };

  return (
    <div>
    <p className="caption mb-4 text-muted">Orden de lectura: izquierda a derecha, fila por fila. Los elementos ocultos no dejan huecos.</p>
    <p role="status" className="caption mb-3">{aviso}</p>
    <ul className="border-t border-line" aria-busy={guardando}>
      {lista.map((expo, indice) => (
        <li
          key={expo.id}
          draggable={!guardando}
          onDragStart={() => setArrastrada(expo.id)}
          onDragEnd={() => setArrastrada(null)}
          onDragOver={(evento) => evento.preventDefault()}
          onDrop={() => soltarSobre(expo.id)}
          className={`cursor-grab border-b border-line py-5 active:cursor-grabbing ${
            arrastrada === expo.id ? "opacity-40" : ""
          }`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <span className="caption">{indice + 1}</span>
            {expo.portada && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={expo.portada.src} alt="" className="h-16 w-16 shrink-0 object-cover" style={{ objectPosition: (expo.portada_foco_x ?? 50) + "% " + (expo.portada_foco_y ?? 50) + "%" }} />
            )}
            <Link href={`${base}/${expo.id}`} className="flex flex-col gap-0.5">
              <span className="text-[1.0625rem] leading-snug">{expo.titulo}</span>
              <span className="caption text-muted">
                {[
                  conLugar
                    ? [expo.lugar, expo.anio ? String(expo.anio) : null]
                        .filter(Boolean)
                        .join(" · ") || "Sin lugar ni año"
                    : null,
                  expo.fotos.length > 0
                    ? `${expo.fotos.length} ${expo.fotos.length === 1 ? "foto" : "fotos"}`
                    : null,
                  `${expo.obrasPublicadas} ${expo.obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-4">
              <button type="button" disabled={guardando || indice === 0} onClick={() => mover(indice, indice - 1)} aria-label={"Subir " + expo.titulo} className="p-2 disabled:opacity-30">↑</button>
              <button type="button" disabled={guardando || indice === lista.length - 1} onClick={() => mover(indice, indice + 1)} aria-label={"Bajar " + expo.titulo} className="p-2 disabled:opacity-30">↓</button>
              <button
                type="button"
                onClick={() => iniciar(() => alternarExposicionPublicada(expo.id, !expo.publicada))}
                disabled={guardando}
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
    </div>
  );
}
