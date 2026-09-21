"use client";

import { useState } from "react";
import { Foto } from "./foto";
import { Lightbox } from "./lightbox";
import type { PiezaAmpliada } from "./piezas";

interface GaleriaProps {
  /** El conjunto completo: la primera es la portada, el resto miniaturas. */
  piezas: PiezaAmpliada[];
  /**
   * Si bajo cada miniatura va su nombre. Las obras lo llevan —cada pieza tiene
   * título— y las vistas de sala no: ahí el título es «Vista 3 de 7», que
   * repetido bajo cada cuadrado es ruido.
   */
  conTitulos?: boolean;
  /** Para el rótulo accesible de cada botón: «Ver … de esta exposición». */
  contexto: string;
}

/** La portada ocupa el ancho del canvas. */
const SIZES_PORTADA = "(max-width: 81rem) 100vw, 1296px";

/** Cuatro columnas en escritorio, tres en tableta, dos en el teléfono. */
const SIZES_MINIATURA = "(max-width: 40rem) 50vw, (max-width: 64rem) 33vw, 320px";

/**
 * El alto máximo de la portada.
 *
 * Una obra muy vertical llenaría la pantalla entera y dejaría las miniaturas
 * fuera de vista; con el tope se ve la foto grande y se intuye que hay más
 * abajo. Como la foto va contenida y no recortada, el aire que sobra a los
 * costados queda sobre el mismo papel del sitio y no se nota.
 */
const TOPE_DE_PORTADA = "max-h-[min(70vh,42rem)]";

/**
 * Una galería: una foto de portada grande y, debajo, miniaturas cuadradas
 * todas iguales.
 *
 * Es la estructura que pidió Jessica y la usan por igual las exposiciones y
 * los conjuntos de trabajo, así que las dos secciones se leen igual.
 *
 * Las miniaturas **sí** se recortan al cuadrado, que es la excepción a la
 * regla del sitio de no recortar nunca la obra (§08). Se justifica igual que
 * el tríptico del Inicio: lo que se gana es una retícula pareja donde la vista
 * recorre sin tropiezos, y la foto completa está a un toque de distancia — al
 * hacer clic, el visor la muestra en su proporción exacta.
 */
export function Galeria({ piezas, conTitulos = false, contexto }: GaleriaProps) {
  const [abierta, setAbierta] = useState<number | null>(null);

  const portada = piezas[0];
  if (!portada) return null;
  const miniaturas = piezas.slice(1);

  return (
    <>
      <div className="flex flex-col gap-[clamp(1rem,2.4vw,1.75rem)]">
        <button
          type="button"
          onClick={() => setAbierta(0)}
          aria-label={`Ver ${portada.titulo ?? portada.alt} en grande`}
          className="group flex w-full cursor-zoom-in flex-col gap-3 text-left"
        >
          <Foto
            src={portada.imagenUrl}
            alt={portada.alt}
            ancho={portada.ancho}
            alto={portada.alto}
            variante="exacta"
            sizes={SIZES_PORTADA}
            prioridad
            className={`w-full ${TOPE_DE_PORTADA}`}
          />
          {conTitulos && portada.titulo && (
            <figcaption className="flex flex-col gap-1">
              <span className="self-start border-b border-transparent font-display text-[1.0625rem] leading-tight font-light transition-colors group-hover:border-accent">
                {portada.titulo}
              </span>
              {portada.subtitulo && <span className="pie text-faint">{portada.subtitulo}</span>}
            </figcaption>
          )}
        </button>

        {miniaturas.length > 0 && (
          <ul className="grid grid-cols-2 gap-[clamp(0.5rem,1.2vw,1rem)] sm:grid-cols-3 lg:grid-cols-4">
            {miniaturas.map((pieza, indice) => (
              <li key={pieza.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setAbierta(indice + 1)}
                  aria-label={`Ver ${pieza.titulo ?? pieza.alt} de ${contexto} en grande`}
                  className="group flex w-full cursor-zoom-in flex-col gap-2 text-left"
                >
                  <Foto
                    src={pieza.imagenUrl}
                    alt={pieza.alt}
                    ancho={pieza.ancho}
                    alto={pieza.alto}
                    proporcionFija={1}
                    encuadre="recortada"
                    sizes={SIZES_MINIATURA}
                    className="w-full"
                  />
                  {conTitulos && pieza.titulo && (
                    <span className="pie truncate text-faint transition-colors group-hover:text-ink">
                      {pieza.titulo}
                    </span>
                  )}
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
