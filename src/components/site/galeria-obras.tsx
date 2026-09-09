"use client";

import { useState } from "react";
import type { Obra } from "@/lib/data/tipos";
import { proporcionEnMosaico } from "@/lib/images";
import { filasJustificadas } from "@/lib/mosaico";
import { fichaDe, FiguraObra } from "./figura-obra";
import { Lightbox, piezasDeObras } from "./lightbox";

interface GaleriaObrasProps {
  obras: Obra[];
  /** Qué se lee bajo el título de cada pieza. */
  pie?: "exposicion" | "ficha";
}

/**
 * Un mosaico de obras con su vista ampliada.
 *
 * La pared de obras usa filas justificadas: la proporción de cada imagen
 * decide su ancho y todas las piezas de una fila comparten altura. Las vistas
 * de sala y las portadas conservan su mosaico de columnas independiente.
 */
export function GaleriaObras({ obras, pie = "exposicion" }: GaleriaObrasProps) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const filas = filasJustificadas(obras, (obra) =>
    proporcionEnMosaico(obra.imagen_ancho, obra.imagen_alto),
  );

  return (
    <>
      <div className="mosaico-justificado">
        {filas.map((fila, filaIndice) => {
          const inicio = filas
            .slice(0, filaIndice)
            .reduce((total, anterior) => total + anterior.length, 0);
          return (
            <div
              key={fila.map((obra) => obra.id).join("-")}
              className="mosaico-justificado-fila"
              style={{
                gridTemplateColumns: fila
                  .map((obra) => proporcionEnMosaico(obra.imagen_ancho, obra.imagen_alto))
                  .map((ratio) => `${ratio}fr`)
                  .join(" "),
              }}
            >
              {fila.map((obra, indice) => (
                <FiguraObra
                  key={obra.id}
                  obra={obra}
                  pie={pie === "exposicion" ? (obra.exposicion?.titulo ?? "Sin exposición") : fichaDe(obra)}
                  onAbrir={() => setAbierta(inicio + indice)}
                  prioridad={inicio + indice === 0}
                  modo="justificado"
                />
              ))}
            </div>
          );
        })}
      </div>

      <Lightbox
        piezas={piezasDeObras(obras)}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </>
  );
}
