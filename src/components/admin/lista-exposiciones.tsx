"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  alternarExposicionPublicada,
  eliminarExposicion,
} from "@/lib/acciones/exposiciones";
import { Confirmar } from "./confirmar";
import type { Exposicion } from "@/lib/data/tipos";

/** Mismo patrón de tarjetas que Obras, con lugar y año a la vista (§07). */
export function ListaExposiciones({ exposiciones }: { exposiciones: Exposicion[] }) {
  const [, iniciar] = useTransition();

  return (
    <ul className="border-t border-line">
      {exposiciones.map((expo) => (
        <li key={expo.id} className="border-b border-line py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <Link href={`/admin/exposiciones/${expo.id}`} className="flex flex-col gap-0.5">
              <span className="text-[1.0625rem] leading-snug">{expo.titulo}</span>
              <span className="caption text-muted">
                {[expo.lugar, expo.anio ? String(expo.anio) : null]
                  .filter(Boolean)
                  .join(" · ") || "Sin lugar ni año"}
                {expo.fotos.length > 0 &&
                  ` · ${expo.fotos.length} ${expo.fotos.length === 1 ? "foto" : "fotos"}`}
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  iniciar(() => alternarExposicionPublicada(expo.id, !expo.publicada))
                }
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
