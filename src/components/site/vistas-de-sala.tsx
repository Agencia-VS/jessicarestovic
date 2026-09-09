"use client";

import { useState } from "react";
import type { Exposicion } from "@/lib/data/tipos";
import { Foto } from "./foto";
import { SIZES_MOSAICO } from "./figura-obra";
import { Lightbox, piezasDeVistas } from "./lightbox";

/**
 * Las vistas de montaje de una muestra, en foto completa y con su vista
 * ampliada. También acá se ven enteras: una sala recortada pierde justamente
 * lo que documenta.
 *
 * Las flechas del visor recorren solo las vistas de esta muestra, que es lo
 * que se espera al haber entrado por ella.
 */
export function VistasDeSala({ exposicion }: { exposicion: Exposicion }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const lugar = [exposicion.lugar, exposicion.anio].filter(Boolean).join(" · ");
  const total = exposicion.fotos.length;

  return (
    <>
      <div className="mosaico">
        {exposicion.fotos.map((foto, indice) => (
          <figure
            key={foto.id}
            className="mb-[clamp(1.875rem,3.8vw,3.875rem)] break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setAbierta(indice)}
              aria-label={`Ver la vista ${indice + 1} de ${exposicion.titulo} en grande`}
              className="flex w-full cursor-zoom-in flex-col gap-3 text-left"
            >
              <Foto
                src={foto.imagenUrl}
                alt={foto.imagen_alt}
                ancho={foto.imagen_ancho}
                alto={foto.imagen_alto}
                sizes={SIZES_MOSAICO}
                prioridad={indice === 0}
                className="w-full"
              />
              <figcaption className="pie text-faint">
                {[lugar, `Vista ${indice + 1} de ${total}`].filter(Boolean).join(" · ")}
              </figcaption>
            </button>
          </figure>
        ))}
      </div>

      <Lightbox
        piezas={piezasDeVistas(exposicion)}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </>
  );
}
