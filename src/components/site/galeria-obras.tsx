"use client";

import { useState } from "react";
import type { Obra } from "@/lib/data/tipos";
import { fichaDe, FiguraObra } from "./figura-obra";
import { Lightbox } from "./lightbox";

interface GaleriaObrasProps {
  obras: Obra[];
  /** Qué se lee bajo el título de cada pieza. */
  pie?: "serie" | "ficha";
}

/**
 * Un mosaico de obras con su vista ampliada.
 *
 * Las columnas CSS son lo que da las alturas variables del §06: cada figura
 * cae donde quepa y conserva su proporción, en vez de calzar en una fila de
 * cuadrados.
 */
export function GaleriaObras({ obras, pie = "serie" }: GaleriaObrasProps) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <>
      <div className="mosaico">
        {obras.map((obra, indice) => (
          <FiguraObra
            key={obra.id}
            obra={obra}
            pie={pie === "serie" ? (obra.serie?.nombre ?? "") : fichaDe(obra)}
            onAbrir={() => setAbierta(indice)}
            prioridad={indice === 0}
          />
        ))}
      </div>

      <Lightbox
        obras={obras}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </>
  );
}
