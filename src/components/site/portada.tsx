"use client";

import { useState } from "react";
import { Foto, Hueco } from "./foto";
import { EnlaceSuave } from "./enlace-suave";
import { Lightbox, piezasDeFotos, type FotoSuelta } from "./lightbox";
import { CELDAS_PORTADA } from "@/lib/site-config";

/**
 * El alto máximo de cada celda: deja la frase visible sin scroll. Es el mismo
 * tope de cuando la portada era una sola foto.
 */
const TOPE_DE_ALTO = "max-h-[calc(100dvh-14.375rem)]";

interface PortadaProps {
  /**
   * Las fotos del tríptico, hasta tres y ya con su URL resuelta. Si no hay
   * ninguna queda el hueco; con una o dos, se reparten el ancho entre las que
   * haya.
   */
  imagenes: FotoSuelta[];
  /** La frase de portada, editable desde el panel. */
  cita: string;
}

/**
 * El Inicio: un tríptico de obra y una sola línea de texto. Nada más.
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
export function Portada({ imagenes, cita }: PortadaProps) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const celdas = imagenes.slice(0, CELDAS_PORTADA);

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
      {celdas.length > 0 ? (
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
        piezas={piezasDeFotos(celdas)}
        indice={abierta}
        onCerrar={() => setAbierta(null)}
        onCambiar={setAbierta}
      />
    </section>
  );
}
