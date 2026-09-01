"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { proporcion, urlImagen } from "@/lib/images";
import type { Obra } from "@/lib/data/tipos";
import { datosObra } from "./obra-pie";

interface LightboxProps {
  obras: Obra[];
  /** Índice de la obra abierta, o `null` si está cerrado. */
  indice: number | null;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

/**
 * Vista ampliada de una obra. Es una capa sobre la galería, no una página
 * aparte (§05), así que el visitante no pierde el lugar donde iba.
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

  const datos = datosObra(obra);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${obra.titulo}, vista ampliada`}
      className="fixed inset-0 z-50 flex flex-col bg-paper"
    >
      <div className="flex h-16 shrink-0 items-center justify-between gutter">
        <span className="caption text-muted">
          {indice + 1} / {obras.length}
        </span>
        <button
          type="button"
          onClick={onCerrar}
          className="flex size-12 items-center justify-end text-ink transition-colors hover:text-muted"
          aria-label="Cerrar vista ampliada"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" />
            <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 md:px-24">
        <div
          className="relative max-h-full w-full"
          style={{ aspectRatio: proporcion(obra.imagen_ancho, obra.imagen_alto) }}
        >
          <Image
            src={urlImagen(obra.imagen_path)}
            alt={obra.imagen_alt}
            fill
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            className="object-contain"
          />
        </div>

        {obras.length > 1 && (
          <>
            <BotonPaso direccion="anterior" onClick={() => irA(-1)} />
            <BotonPaso direccion="siguiente" onClick={() => irA(1)} />
          </>
        )}
      </div>

      <div className="gutter flex shrink-0 flex-wrap gap-x-5 gap-y-1 py-8">
        <span className="caption text-ink">{obra.titulo}</span>
        {datos.map((dato) => (
          <span key={dato} className="caption text-muted">
            {dato}
          </span>
        ))}
      </div>
    </div>
  );
}

function BotonPaso({
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
      className={`absolute inset-y-0 flex w-16 items-center text-muted transition-colors hover:text-ink md:w-24 ${
        esAnterior ? "left-0 justify-start" : "right-0 justify-end"
      }`}
    >
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
        <path
          d={esAnterior ? "M10 1 L2 10 L10 19" : "M2 1 L10 10 L2 19"}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    </button>
  );
}
