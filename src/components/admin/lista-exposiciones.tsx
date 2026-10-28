"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition, type PointerEvent } from "react";
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
  const [lista, ordenarOptimista] = useOptimistic(exposiciones, (actual, ids: string[]) => {
    const posiciones = new Map(ids.map((id, i) => [id, i]));
    return [...actual].sort((a, b) =>
      (posiciones.get(a.id) ?? ids.length) - (posiciones.get(b.id) ?? ids.length));
  });
  const [arrastrada, setArrastrada] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();
  const [aviso, setAviso] = useState("");
  const ocupado = useRef(false);
  const gesto = useRef<{ id: string; x: number; y: number; movido: boolean } | null>(null);

  const mover = (desde: number, hasta: number) => {
    if (ocupado.current || guardando || desde < 0 || hasta < 0 || hasta >= lista.length || desde === hasta) return;
    const nueva = [...lista];
    const [movida] = nueva.splice(desde, 1);
    if (!movida) return;
    nueva.splice(hasta, 0, movida);
    ocupado.current = true;
    setArrastrada(null);
    setAviso("Guardando orden…");
    iniciar(async () => {
      ordenarOptimista(nueva.map((e) => e.id));
      try {
        const resultado = await reordenarExposiciones(nueva.map((expo) => expo.id), movida.tipo);
        setAviso(resultado.aviso ?? "");
      } catch {
        setAviso("No se pudo guardar. Se recuperó el orden del servidor.");
      } finally {
        ocupado.current = false;
      }
    });
  };
  const cancelarArrastre = () => {
    gesto.current = null;
    setArrastrada(null);
    setDestino(null);
  };
  const filaBajo = (evento: PointerEvent<HTMLButtonElement>) =>
    document.elementFromPoint(evento.clientX, evento.clientY)
      ?.closest<HTMLElement>("[data-grupo-id]")?.dataset.grupoId;
  const comenzarArrastre = (evento: PointerEvent<HTMLButtonElement>, id: string) => {
    if (guardando || ocupado.current || evento.button !== 0) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    gesto.current = { id, x: evento.clientX, y: evento.clientY, movido: false };
  };
  const seguirArrastre = (evento: PointerEvent<HTMLButtonElement>) => {
    const actual = gesto.current;
    if (!actual) return;
    if (!actual.movido && Math.hypot(evento.clientX - actual.x, evento.clientY - actual.y) < 6) return;
    actual.movido = true;
    setArrastrada(actual.id);
    setDestino(filaBajo(evento) ?? null);
    if (evento.clientY < 60) window.scrollBy(0, -16);
    else if (evento.clientY > window.innerHeight - 60) window.scrollBy(0, 16);
  };
  const terminarArrastre = (evento: PointerEvent<HTMLButtonElement>) => {
    const actual = gesto.current;
    const objetivo = filaBajo(evento);
    cancelarArrastre();
    if (actual?.movido && objetivo) mover(lista.findIndex((e) => e.id === actual.id), lista.findIndex((e) => e.id === objetivo));
  };

  return (
    <div>
    <p className="caption mb-4 text-muted">Arrastra desde ↕ o usa las flechas. El orden se lee de izquierda a derecha, fila por fila. Los elementos ocultos no dejan huecos.</p>
    <p role="status" className="caption mb-3">{aviso}</p>
    <ul className="border-t border-line" aria-busy={guardando}>
      {lista.map((expo, indice) => (
        <li
          key={expo.id}
          data-grupo-id={expo.id}
          className={`border-b py-5 ${destino === expo.id ? "border-accent" : "border-line"} ${
            arrastrada === expo.id ? "opacity-40" : ""
          }`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <button
              type="button"
              disabled={guardando}
              aria-label={"Arrastrar " + expo.titulo}
              onPointerDown={(evento) => comenzarArrastre(evento, expo.id)}
              onPointerMove={seguirArrastre}
              onPointerUp={terminarArrastre}
              onPointerCancel={cancelarArrastre}
              onLostPointerCapture={cancelarArrastre}
              className="caption cursor-grab touch-none select-none p-3 active:cursor-grabbing disabled:opacity-30"
            >↕ <span>{indice + 1}</span></button>
            {expo.portada && (
              // eslint-disable-next-line @next/next/no-img-element
              <img draggable={false} src={expo.portada.src} alt="" className="h-16 w-16 shrink-0 object-cover" style={{ objectPosition: (expo.portada_foco_x ?? 50) + "% " + (expo.portada_foco_y ?? 50) + "%" }} />
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
                onClick={() => iniciar(async () => {
                  try {
                    const resultado = await alternarExposicionPublicada(expo.id, !expo.publicada);
                    setAviso(resultado.aviso ?? "");
                  } catch { setAviso("No se pudo cambiar la publicación."); }
                })}
                disabled={guardando}
                aria-pressed={expo.publicada}
                className={`caption transition-colors ${
                  expo.publicada ? "text-ink" : "text-faint hover:text-muted"
                }`}
              >
                {expo.publicada ? "● Publicada" : "○ Oculta"}
              </button>

              <Confirmar
                disabled={guardando}
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
