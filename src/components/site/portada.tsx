"use client";

import { useState } from "react";
import { Foto, Hueco } from "./foto";
import { EnlaceSuave } from "./enlace-suave";
import { Lightbox } from "./lightbox";
import { piezasDeFotos } from "./piezas";
import type { FotoLista } from "@/lib/data/tipos";
import { proporcion } from "@/lib/images";
import { CELDAS_PORTADA } from "@/lib/site-config";

/**
 * El alto máximo de cada celda: deja la frase visible sin scroll. Es el mismo
 * tope de cuando la portada era una sola foto.
 */
const TOPE_DE_ALTO = "max-h-[calc(100dvh-14.375rem)]";

/** La foto grande del Inicio y qué parte de ella se ve. */
export interface FotoGrande extends FotoLista {
  /** De 0 (la parte de arriba) a 100 (la de abajo). */
  foco: number;
}

interface PortadaProps {
  /**
   * Las fotos del tríptico, hasta tres y ya con su URL resuelta. Si no hay
   * ninguna queda el hueco; con una o dos, se reparten el ancho entre las que
   * haya.
   */
  imagenes: FotoLista[];
  /** Si llega, el Inicio es esta sola foto en vez del tríptico. */
  grande?: FotoGrande | null;
  /** La frase de portada, editable desde el panel. */
  cita: string;
}

/**
 * El Inicio: un tríptico de obra —o una sola foto grande— y una sola línea de
 * texto. Nada más.
 *
 * La foto grande ocupa el lugar de las tres: en el computador es una franja
 * con el ancho del canvas y el alto de una celda del tríptico, y Jessica elige
 * desde el panel qué parte de la foto se ve. En el teléfono, donde una franja
 * así mediría un dedo de alto, se ve en su proporción, entera.
 *
 * Son tres cuadrados iguales, apenas separados, ocupando el ancho del canvas.
 * En el celular se apilan en vez de encogerse: tres cuadrados en fila sobre
 * 350 px darían una franja de 114 px de alto, donde la obra no se ve.
 *
 * Es el único lugar del sitio donde la foto se recorta, y es a propósito: tres
 * cuadrados llenos son la composición que se buscaba, y con `object-contain`
 * una pieza vertical dejaría su celda a medio ancho y la fila se vería
 * desparejo. El recorte no esconde nada, porque al tocar cualquiera de las tres
 * se abre completa y sin recortar.
 *
 * Es el único lugar del sitio donde Jessica habla en su nombre desde el primer
 * segundo, así que la frase es contenido, no decoración — se edita en «Inicio»
 * del panel.
 */
export function Portada({ imagenes, grande = null, cita }: PortadaProps) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const celdas = imagenes.slice(0, CELDAS_PORTADA);
  /** Lo que abre el visor, sin recortar: la foto grande o las del tríptico. */
  const ampliables = grande ? [grande] : celdas;

  // El ancho de cada celda es exacto, no una estimación: apilada mide el canvas
  // completo (90vw contando sus márgenes laterales) y en fila, ese ancho
  // repartido entre las celdas que haya, hasta el tope de 1440px. Así el
  // navegador pide justo la versión que va a mostrar.
  const reparto = Math.max(celdas.length, 1);
  const sizes = [
    "(max-width: 40rem) 90vw",
    `(max-width: 90rem) ${Math.round(90 / reparto)}vw`,
    `${Math.round(1296 / reparto)}px`,
  ].join(", ");

  return (
    <section className="marco gutter flex flex-col gap-[clamp(1.125rem,2.4vw,2rem)] pt-[clamp(1.25rem,3vw,2.75rem)] pb-[clamp(1.75rem,4vw,3.5rem)]">
      {grande ? (
        <button
          type="button"
          onClick={() => setAbierta(0)}
          aria-label={`Ver ${grande.alt} en grande`}
          className="block w-full cursor-zoom-in"
        >
          {/* El marco tiene la proporción de la foto en el teléfono y la de la
              franja —tres celdas de ancho por una de alto— desde que el
              tríptico va en fila. La foto lo llena y, si sobra, se recorta
              por donde Jessica eligió. */}
          <div
            style={{ "--proporcion": proporcion(grande.ancho, grande.alto) } as React.CSSProperties}
            className={`aspect-(--proporcion) w-full sm:aspect-[3/1] ${TOPE_DE_ALTO}`}
          >
            <Foto
              src={grande.src}
              alt={grande.alt}
              ancho={grande.ancho}
              alto={grande.alto}
              variante="exacta"
              encuadre="recortada"
              foco={grande.foco}
              sizes="(max-width: 90rem) 90vw, 1296px"
              prioridad
              className="h-full w-full"
            />
          </div>
        </button>
      ) : celdas.length > 0 ? (
        <div className="grid w-full grid-cols-1 gap-1 sm:grid-cols-3">
          {celdas.map((imagen, indice) => (
            <button
              key={imagen.src}
              type="button"
              onClick={() => setAbierta(indice)}
              aria-label={`Ver ${imagen.alt} en grande`}
              className="cursor-zoom-in"
            >
              <Foto
                src={imagen.src}
                alt={imagen.alt}
                ancho={imagen.ancho}
                alto={imagen.alto}
                proporcionFija={1}
                encuadre="recortada"
                sizes={sizes}
                prioridad
                className={`w-full ${TOPE_DE_ALTO}`}
              />
            </button>
          ))}
        </div>
      ) : (
        <Hueco
          proporcion={3 / 2}
          etiqueta="Las tres fotos de portada se suben en «Inicio» del panel"
          className={`${TOPE_DE_ALTO} min-h-80`}
        />
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-x-[clamp(1rem,3vw,3rem)] gap-y-4">
        <p className="max-w-[34ch] font-display text-[clamp(1.1875rem,2vw,1.6875rem)] leading-[1.45] font-light -tracking-[0.01em] text-pretty">
          {cita}
        </p>
        <EnlaceSuave href="/exposiciones">Ver exposiciones</EnlaceSuave>
      </div>

      <Lightbox
        piezas={piezasDeFotos(ampliables)}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </section>
  );
}
