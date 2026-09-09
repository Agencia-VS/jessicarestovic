"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Exposicion, Obra } from "@/lib/data/tipos";
import { Foto } from "./foto";

/**
 * Una foto tal como la muestra la vista ampliada, ya sin importar de dónde
 * viene: una obra, una vista de sala o una de las del Inicio.
 *
 * El visor es uno solo a propósito —mismas flechas, mismo Escape, mismo
 * contador, mismo gesto de arrastre— y lo único que cambia por tipo de foto es
 * qué se lee abajo. Los `piezasDe…` de este archivo son esa traducción, y viven
 * acá para que «qué dice el visor de cada cosa» se lea de corrido.
 */
export interface PiezaAmpliada {
  id: string;
  imagenUrl: string;
  alt: string;
  ancho: number | null;
  alto: number | null;
  /** Lo que se lee grande abajo a la izquierda, si hay. */
  titulo: string | null;
  /** La línea chica bajo el título, si hay. */
  subtitulo: string | null;
  /** Los datos de ficha de la derecha; vacío es válido y no dibuja nada. */
  ficha: { clave: string; valor: string }[];
}

/** Una foto que no es obra catalogada: solo su archivo y su descripción. */
export interface FotoSuelta {
  src: string;
  alt: string;
  ancho: number | null;
  alto: number | null;
}

/** Las obras de una retícula, con su ficha completa. */
export function piezasDeObras(obras: Obra[]): PiezaAmpliada[] {
  return obras.map((obra) => ({
    id: obra.id,
    imagenUrl: obra.imagenUrl,
    alt: obra.imagen_alt,
    ancho: obra.imagen_ancho,
    alto: obra.imagen_alto,
    titulo: obra.titulo,
    subtitulo: obra.exposicion?.titulo ?? null,
    ficha: [
      { clave: "Año", valor: obra.anio ? String(obra.anio) : "—" },
      { clave: "Técnica", valor: obra.tecnica ?? "—" },
      { clave: "Dimensiones", valor: obra.dimensiones ?? "—" },
    ],
  }));
}

/**
 * Las vistas de montaje de una muestra. Acá no hay ficha de obra —una sala no
 * tiene técnica ni medidas—, así que el pie es la muestra y su lugar.
 */
export function piezasDeVistas(exposicion: Exposicion): PiezaAmpliada[] {
  const lugar = [exposicion.lugar, exposicion.anio].filter(Boolean).join(" · ");

  return exposicion.fotos.map((foto, indice) => ({
    id: foto.id,
    imagenUrl: foto.imagenUrl,
    alt: foto.imagen_alt,
    ancho: foto.imagen_ancho,
    alto: foto.imagen_alto,
    titulo: `Vista ${indice + 1} de ${exposicion.fotos.length}`,
    subtitulo: [exposicion.titulo, lugar].filter(Boolean).join(" · ") || null,
    ficha: [],
  }));
}

/**
 * Fotos sueltas, como las del tríptico del Inicio: el visor muestra solo la
 * foto y el contador, porque no hay título ni ficha que mostrar.
 */
export function piezasDeFotos(fotos: FotoSuelta[]): PiezaAmpliada[] {
  return fotos.map((foto) => ({
    id: foto.src,
    imagenUrl: foto.src,
    alt: foto.alt,
    ancho: foto.ancho,
    alto: foto.alto,
    titulo: null,
    subtitulo: null,
    ficha: [],
  }));
}

interface LightboxProps {
  /** La secuencia que recorren las flechas: el conjunto visible. */
  piezas: PiezaAmpliada[];
  /** Índice de la foto abierta, o `null` si está cerrado. */
  indice: number | null;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

/** Cuánto hay que arrastrar para que cuente como cambio de foto. */
const ARRASTRE_MINIMO = 44;

/**
 * Vista ampliada de una foto. Es una capa sobre la página, no una página
 * aparte (§05), así que el visitante no pierde el lugar donde iba.
 *
 * Recorre solo la secuencia con la que se abrió —las piezas de ese conjunto,
 * las vistas de esa muestra, las tres del Inicio— y acá la proporción es
 * exacta: sin el tope del mosaico ni el cuadrado de la portada, la foto se ve
 * tal como es.
 */
export function Lightbox({ piezas, indice, onCerrar, onCambiar }: LightboxProps) {
  const abierto = indice !== null;
  const pieza = indice !== null ? piezas[indice] : undefined;
  const inicioDelArrastre = useRef<number | null>(null);

  const irA = useCallback(
    (salto: number) => {
      if (indice === null || piezas.length === 0) return;
      onCambiar((indice + salto + piezas.length) % piezas.length);
    },
    [indice, piezas.length, onCambiar],
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

  if (!abierto || !pieza) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${pieza.titulo ?? pieza.alt}, vista ampliada`}
      className="fixed inset-0 z-90 flex flex-col bg-paper-alt"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-5 px-[clamp(1.25rem,4vw,3rem)] py-[clamp(1rem,2.2vw,1.625rem)]">
        <span className="eyebrow text-faint">
          {indice + 1} / {piezas.length}
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
        {piezas.length > 1 && <Paso direccion="anterior" onClick={() => irA(-1)} />}

        {/* En el celular no hay flechas de teclado, así que se pasa arrastrando:
            el mismo gesto que en la galería del teléfono. */}
        <div
          className="flex h-full min-w-0 flex-1 items-center justify-center"
          onTouchStart={(evento) => {
            inicioDelArrastre.current = evento.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(evento) => {
            const desde = inicioDelArrastre.current;
            const hasta = evento.changedTouches[0]?.clientX;
            inicioDelArrastre.current = null;
            if (desde === null || hasta === undefined) return;
            const recorrido = hasta - desde;
            if (Math.abs(recorrido) < ARRASTRE_MINIMO) return;
            irA(recorrido < 0 ? 1 : -1);
          }}
        >
          <Foto
            src={pieza.imagenUrl}
            alt={pieza.alt}
            ancho={pieza.ancho}
            alto={pieza.alto}
            variante="exacta"
            sizes="(max-width: 48rem) 100vw, 80vw"
            prioridad
            className="h-[min(72vh,53.75rem)] max-h-full w-auto max-w-full shrink-0"
          />
        </div>

        {piezas.length > 1 && <Paso direccion="siguiente" onClick={() => irA(1)} />}
      </div>

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(1rem,2.4vw,1.875rem)] pb-[clamp(1.25rem,3vw,2.375rem)]">
        <div className="flex min-w-0 flex-col gap-1.5">
          {pieza.titulo && (
            <span className="font-display text-[clamp(1.375rem,2.4vw,2rem)] leading-[1.15] font-light italic">
              {pieza.titulo}
            </span>
          )}
          {pieza.subtitulo && <span className="eyebrow text-muted">{pieza.subtitulo}</span>}
        </div>

        {pieza.ficha.length > 0 && (
          <div className="flex flex-wrap gap-[clamp(1rem,2.6vw,2.5rem)]">
            {pieza.ficha.map(({ clave, valor }) => (
              <div key={clave} className="flex flex-col gap-[3px]">
                <span className="etiqueta text-label">{clave}</span>
                <span className="text-[0.8125rem] font-light text-body">{valor}</span>
              </div>
            ))}
          </div>
        )}
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
      aria-label={esAnterior ? "Foto anterior" : "Foto siguiente"}
      className="shrink-0 font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-none font-extralight text-label transition-colors hover:text-ink"
    >
      {esAnterior ? "‹" : "›"}
    </button>
  );
}
