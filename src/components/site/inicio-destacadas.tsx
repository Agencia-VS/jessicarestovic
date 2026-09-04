"use client";

import Link from "next/link";
import { useState } from "react";
import type { Obra } from "@/lib/data/tipos";
import { ObraImagen } from "./obra-imagen";


interface InicioDestacadasProps {
  obras: Obra[];
  /** La frase que cierra la portada, editable desde el panel. */
  cita: string;
}

/**
 * El Inicio: una obra a la vez, centrada, con su ficha debajo. Si Jessica
 * destacó varias, se pasa entre ellas sin salir de la página — el ritmo
 * pausado de la dirección «Sala blanca», no un carrusel automático.
 */
export function InicioDestacadas({ obras, cita }: InicioDestacadasProps) {
  const [indice, setIndice] = useState(0);
  const obra = obras[indice];

  if (!obra) return null;

  return (
    <>
      <div className="flex flex-1 items-center justify-center gutter py-14 md:py-18">
        <figure className="flex w-full max-w-[34.5rem] flex-col gap-5">
          <ObraImagen
            obra={obra}
            sizes="(max-width: 768px) 100vw, 552px"
            prioridad
            className="max-h-[70vh]"
          />
          <figcaption className="caption flex flex-wrap gap-x-5 gap-y-1 tracking-[0.05em] text-muted">
            <span className="text-ink">{obra.titulo}</span>
            {obra.tecnica && <span>{obra.tecnica}</span>}
          </figcaption>
        </figure>
      </div>

      {obras.length > 1 && (
        <div className="gutter flex gap-2 pb-4" role="group" aria-label="Obras destacadas">
          {obras.map((candidata, i) => (
            <button
              key={candidata.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ver ${candidata.titulo}`}
              aria-pressed={i === indice}
              className={`h-px w-10 transition-colors ${
                i === indice ? "bg-ink" : "bg-line hover:bg-faint"
              }`}
            />
          ))}
        </div>
      )}

      <div className="gutter pb-16">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-line pt-6.5 md:flex-row md:items-baseline md:gap-12">
          <p className="max-w-[52ch] text-[0.9375rem] leading-relaxed text-body text-pretty">
            «{cita}»
          </p>
          <Link
            href="/obra"
            className="eyebrow whitespace-nowrap text-ink transition-colors hover:text-muted"
          >
            Ver la obra
          </Link>
        </div>
      </div>
    </>
  );
}
