"use client";

import { useEffect, useRef, useState } from "react";
import { Foto } from "./foto";
import { Lightbox } from "./lightbox";
import { Paso } from "./paso";
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
 * Todo en una misma fila. Cuando hay muchas piezas las miniaturas **no**
 * siguen creciendo hacia abajo: la tira llena sus filas y sigue hacia la
 * derecha. Eso mantiene la pintura principal y su conjunto dentro de una sola
 * pantalla, en vez de una retícula que empuja todo lo demás fuera de vista.
 *
 * La tira avanza **con flechas, de página en página**, y no arrastrando. El
 * desplazamiento libre no gustó: en un trackpad se pasa de largo, y sin una
 * flecha a la vista nada anuncia que hay más miniaturas. Con dos botones la
 * tira se lee como lo que es.
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
  const pista = useRef<HTMLUListElement>(null);
  const [pagina, setPagina] = useState(0);

  const portada = piezas[0];
  const miniaturas = piezas.slice(1);

  /**
   * Cuántas miniaturas entran en una página.
   *
   * Empieza en «todas» y se corrige al medir. No hay parpadeo porque la tira
   * recorta lo que sobra, así que en el primer cuadro se ve exactamente la
   * primera página igual.
   */
  const [porPagina, setPorPagina] = useState(miniaturas.length);

  /**
   * Se mide en vez de calcularse: cuántos cuadrados caben depende del ancho
   * disponible y de cuántas filas tiene la tira, que cambian con la ventana.
   * El observador responde también al cambio de tamaño, así que al angostarla
   * las flechas siguen diciendo la verdad.
   */
  useEffect(() => {
    const elemento = pista.current;
    if (!elemento) return;

    const medir = () => {
      const celda = elemento.querySelector("li");
      if (!celda || elemento.clientWidth === 0) return;

      const estilo = getComputedStyle(elemento);
      const lado = celda.getBoundingClientRect().width;
      if (lado === 0) return;
      const hueco = Number.parseFloat(estilo.columnGap) || 0;
      const filas = estilo.gridTemplateRows.split(" ").filter(Boolean).length;
      const columnas = Math.max(1, Math.floor((elemento.clientWidth + hueco) / (lado + hueco)));

      setPorPagina(Math.max(1, columnas * filas));
    };

    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  if (!portada) return null;

  const paginas = Math.max(1, Math.ceil(miniaturas.length / porPagina));
  // Al ensanchar la ventana caben más y sobran páginas: se acota al vuelo en
  // vez de corregir el estado desde un efecto.
  const actual = Math.min(pagina, paginas - 1);
  const visibles = miniaturas.slice(actual * porPagina, (actual + 1) * porPagina);
  const hayFlechas = paginas > 1;

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
          <div className="flex min-w-0 items-center gap-[clamp(0.25rem,1vw,0.75rem)] lg:col-span-2">
            {hayFlechas && (
              <Paso
                direccion="anterior"
                onClick={() => setPagina(actual - 1)}
                desactivado={actual === 0}
                rotulo="Miniaturas"
              />
            )}

            <ul
              ref={pista}
              // `grid-flow-col` llena las filas y sigue hacia la derecha en vez
              // de hacia abajo. No hay desplazamiento: cada página dibuja solo
              // sus miniaturas, así que la tira siempre empieza y termina en una
              // columna entera. Desplazando quedaba una astilla de la columna
              // anterior en la última página, que se lee como un error.
              className="grid min-w-0 flex-1 auto-cols-[var(--lado)] grid-flow-col grid-rows-[repeat(2,var(--lado))] gap-[var(--hueco)] overflow-hidden lg:grid-rows-[repeat(3,var(--lado))]"
            >
              {visibles.map((pieza, indice) => (
                <li key={pieza.id}>
                  <button
                    type="button"
                    onClick={() => setAbierta(actual * porPagina + indice + 1)}
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

            {hayFlechas && (
              <Paso
                direccion="siguiente"
                onClick={() => setPagina(actual + 1)}
                desactivado={actual >= paginas - 1}
                rotulo="Miniaturas"
              />
            )}
          </div>
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
