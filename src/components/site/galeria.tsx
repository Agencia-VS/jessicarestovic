"use client";

import { useState } from "react";
import { Foto } from "./foto";
import { Lightbox } from "./lightbox";
import type { PiezaAmpliada } from "./piezas";

interface GaleriaProps {
  /** El conjunto completo: la primera es la portada, el resto miniaturas. */
  piezas: PiezaAmpliada[];
  /**
   * Si bajo la portada va su nombre. Las obras lo llevan —cada pieza tiene
   * título— y las vistas de sala no: ahí el título es «Vista 1 de 7», que no
   * dice nada que el visor no diga mejor.
   */
  conTitulos?: boolean;
  /** Para el rótulo accesible de cada botón: «Ver … de esta exposición». */
  contexto: string;
}

/** La portada ocupa un tercio del canvas. */
const SIZES_PORTADA = "(max-width: 64rem) 100vw, 420px";

/** Cada miniatura es un cuadrado de lado fijo. */
const SIZES_MINIATURA = "(max-width: 64rem) 8rem, 128px";

/**
 * El lado de cada miniatura y el aire entre ellas.
 *
 * Son variables de CSS y no números sueltos porque de ellas sale también el
 * alto de la tira —dos o tres cuadrados más sus huecos— y con ese alto se topa
 * la portada. Así las dos columnas terminan a la misma altura sin que nadie
 * mida nada a mano.
 */
const MEDIDAS = {
  "--lado": "clamp(4.5rem, 8.5vw, 8rem)",
  "--hueco": "clamp(0.375rem, 0.9vw, 0.75rem)",
} as React.CSSProperties;

/**
 * Una galería: la pintura principal en el primer tercio y, a su lado, las
 * miniaturas cuadradas ocupando los otros dos.
 *
 * Todo en una misma fila, que es como lo pidió Jessica. Cuando hay muchas
 * piezas las miniaturas **no** siguen creciendo hacia abajo: la tira llena sus
 * filas y sigue hacia la derecha, y se recorre deslizando. Eso mantiene la
 * pintura principal y su conjunto dentro de una sola pantalla, en vez de una
 * retícula que empuja todo lo demás fuera de vista.
 *
 * En el teléfono la fila se parte —la portada arriba, la tira debajo— porque
 * un tercio de 390 px no es una pintura, es una estampilla.
 *
 * Las miniaturas **sí** se recortan al cuadrado, que es la excepción a la
 * regla del sitio de no recortar nunca la obra (§08). Se justifica igual que
 * el tríptico del Inicio: lo que se gana es una tira pareja que la vista
 * recorre sin tropiezos, y la obra completa está a un toque — al hacer clic,
 * el visor la muestra en su proporción exacta.
 */
export function Galeria({ piezas, conTitulos = false, contexto }: GaleriaProps) {
  const [abierta, setAbierta] = useState<number | null>(null);

  const portada = piezas[0];
  if (!portada) return null;
  const miniaturas = piezas.slice(1);

  return (
    <>
      <div
        style={MEDIDAS}
        className="flex flex-col gap-[clamp(1rem,2vw,1.5rem)] lg:grid lg:grid-cols-3 lg:items-start"
      >
        <button
          type="button"
          onClick={() => setAbierta(0)}
          aria-label={`Ver ${portada.titulo ?? portada.alt} en grande`}
          className="group flex w-full min-w-0 cursor-zoom-in flex-col gap-3 text-left"
        >
          <Foto
            src={portada.imagenUrl}
            alt={portada.alt}
            ancho={portada.ancho}
            alto={portada.alto}
            variante="exacta"
            anclaje="izquierda"
            sizes={SIZES_PORTADA}
            prioridad
            // El tope solo aplica donde la portada comparte fila con la tira:
            // ahí las dos columnas tienen que terminar a la misma altura. En el
            // teléfono, apiladas, toparla a la altura de la tira dejaba la
            // pintura principal en 150 px — una estampilla.
            className="w-full max-h-[60vh] lg:max-h-[calc(3*var(--lado)+2*var(--hueco))]"
          />
          {conTitulos && portada.titulo && (
            <span className="flex flex-col gap-1">
              <span className="self-start border-b border-transparent font-display text-[1.0625rem] leading-tight font-light transition-colors group-hover:border-accent">
                {portada.titulo}
              </span>
              {portada.subtitulo && <span className="pie text-faint">{portada.subtitulo}</span>}
            </span>
          )}
        </button>

        {miniaturas.length > 0 && (
          <ul
            // `grid-flow-col` es lo que hace la tira: llena las filas y sigue
            // hacia la derecha en vez de hacia abajo. El desplazamiento lo
            // hace el navegador, con su inercia y su gesto de siempre.
            className="grid snap-x snap-mandatory auto-cols-[var(--lado)] grid-flow-col grid-rows-[repeat(2,var(--lado))] gap-[var(--hueco)] overflow-x-auto overscroll-x-contain lg:col-span-2 lg:grid-rows-[repeat(3,var(--lado))]"
          >
            {miniaturas.map((pieza, indice) => (
              <li key={pieza.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => setAbierta(indice + 1)}
                  aria-label={`Ver ${pieza.titulo ?? pieza.alt} de ${contexto} en grande`}
                  className="block h-full w-full cursor-zoom-in"
                >
                  <Foto
                    src={pieza.imagenUrl}
                    alt={pieza.alt}
                    ancho={pieza.ancho}
                    alto={pieza.alto}
                    proporcionFija={1}
                    encuadre="recortada"
                    sizes={SIZES_MINIATURA}
                    className="h-full w-full"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Lightbox
        piezas={piezas}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </>
  );
}
