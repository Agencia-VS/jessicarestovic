"use client";

import { useCallback, useEffect } from "react";
import type { Obra } from "@/lib/data/tipos";
import { Foto } from "./foto";

interface LightboxProps {
  /** La secuencia que recorren las flechas: el filtro o la serie visible. */
  obras: Obra[];
  /** Índice de la obra abierta, o `null` si está cerrado. */
  indice: number | null;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

/**
 * Vista ampliada de una obra. Es una capa sobre la retícula, no una página
 * aparte (§05), así que el visitante no pierde el lugar donde iba.
 *
 * Recorre solo la secuencia con la que se abrió —las piezas de esa serie, o
 * las del filtro activo— y acá la proporción es exacta: sin el tope del
 * mosaico, la obra se ve tal como es.
 */
export function Lightbox({ obras, indice, onCerrar, onCambiar }: LightboxProps) {
  const abierto = indice !== null;
  const obra = indice !== null ? obras[indice] : undefined;

  const irA = useCallback(
    (salto: number) => {
      if (indice === null || obras.length === 0) return;
      onCambiar((indice + salto + obras.length) % obras.length);
    },
    [indice, obras.length, onCambiar],
  );

  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
      if (evento.key === "ArrowRight") irA(1);
      if (evento.key === "ArrowLeft") irA(-1);
    };
    document.addEventListener("keydown", alPresionar);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, irA, onCerrar]);

  if (!abierto || !obra) return null;

  const lineas = [
    { clave: "Año", valor: obra.anio ? String(obra.anio) : "—" },
    { clave: "Técnica", valor: obra.tecnica ?? "—" },
    { clave: "Dimensiones", valor: obra.dimensiones ?? "—" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${obra.titulo}, vista ampliada`}
      className="fixed inset-0 z-90 flex flex-col bg-paper-alt"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-5 px-[clamp(1.25rem,4vw,3rem)] py-[clamp(1rem,2.2vw,1.625rem)]">
        <span className="eyebrow text-faint">
          {indice + 1} / {obras.length}
        </span>
        <button
          type="button"
          onClick={onCerrar}
          className="eyebrow border-b border-rule-soft pb-[3px] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
        >
          Cerrar
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-[clamp(0.625rem,2vw,1.75rem)] px-[clamp(0.875rem,3vw,2.5rem)]">
        {obras.length > 1 && <Paso direccion="anterior" onClick={() => irA(-1)} />}

        <div className="flex h-full min-w-0 flex-1 items-center justify-center">
          <Foto
            path={obra.imagen_path}
            alt={obra.imagen_alt}
            ancho={obra.imagen_ancho}
            alto={obra.imagen_alto}
            variante="exacta"
            sizes="(max-width: 48rem) 100vw, 80vw"
            prioridad
            className="h-[min(72vh,53.75rem)] max-h-full w-auto max-w-full shrink-0"
          />
        </div>

        {obras.length > 1 && <Paso direccion="siguiente" onClick={() => irA(1)} />}
      </div>

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(1rem,2.4vw,1.875rem)] pb-[clamp(1.25rem,3vw,2.375rem)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-display text-[clamp(1.375rem,2.4vw,2rem)] leading-[1.15] font-light italic">
            {obra.titulo}
          </span>
          {obra.serie && <span className="eyebrow text-muted">{obra.serie.nombre}</span>}
        </div>

        <div className="flex flex-wrap gap-[clamp(1rem,2.6vw,2.5rem)]">
          {lineas.map(({ clave, valor }) => (
            <div key={clave} className="flex flex-col gap-[3px]">
              <span className="etiqueta text-label">{clave}</span>
              <span className="text-[0.8125rem] font-light text-body">{valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Las flechas: el mismo serif del sitio, no un icono. */
function Paso({
  direccion,
  onClick,
}: {
  direccion: "anterior" | "siguiente";
  onClick: () => void;
}) {
  const esAnterior = direccion === "anterior";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={esAnterior ? "Obra anterior" : "Obra siguiente"}
      className="shrink-0 font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-none font-extralight text-label transition-colors hover:text-ink"
    >
      {esAnterior ? "‹" : "›"}
    </button>
  );
}
