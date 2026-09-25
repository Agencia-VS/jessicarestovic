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
   * El rótulo del grupo: en escritorio va bajo la portada y en el teléfono
   * sobre ella. Llega armado desde el servidor porque lleva el `<h1>` de la
   * página.
   */
  cartela?: React.ReactNode;
  /** Para el rótulo accesible de cada botón: «Ver … de esta exposición». */
  contexto: string;
}

/** La portada ocupa un tercio del canvas. */
const SIZES_PORTADA = "(max-width: 64rem) 100vw, 420px";

/**
 * Cada miniatura es un cuadrado: un cuarto del ancho en el teléfono, un sexto
 * en la tableta y 128 px como mucho en la tira de escritorio.
 */
const SIZES_MINIATURA = "(max-width: 40rem) 25vw, (max-width: 64rem) 17vw, 128px";

/** Desde dónde la galería es una fila, con la portada y la tira lado a lado. */
const ESCRITORIO = "(min-width: 64rem)";

/**
 * El lado de cada miniatura y el aire entre ellas.
 *
 * Son variables de CSS y no números sueltos porque de ellas sale también el
 * alto de la tira —tres cuadrados más sus huecos— y con ese alto se topa la
 * portada. Así las dos columnas terminan a la misma altura sin que nadie mida
 * nada a mano.
 */
const MEDIDAS = {
  "--lado": "clamp(4.5rem, 8.5vw, 8rem)",
  "--hueco": "clamp(0.375rem, 0.9vw, 0.75rem)",
} as React.CSSProperties;

/**
 * Una galería: la pintura principal, su cartela y las miniaturas cuadradas.
 *
 * En escritorio va todo en una fila: la portada y su cartela en el primer
 * tercio, y la tira en los otros dos. Cuando hay muchas piezas la tira no
 * crece hacia abajo: llena tres filas y avanza **con flechas, de página en
 * página**. El desplazamiento libre no gustó: en un trackpad se pasa de largo
 * y sin una flecha a la vista nada anuncia que hay más.
 *
 * En el teléfono se apila —la cartela, la portada y **todas** las miniaturas
 * en una grilla— porque ahí lo natural es bajar, no pasar de página. El orden
 * lo pone la utilidad `galeria` de `globals.css`.
 *
 * Las miniaturas **sí** se recortan al cuadrado, que es la excepción a la
 * regla del sitio de no recortar nunca la obra (§08). Se justifica igual que
 * el tríptico del Inicio: lo que se gana es una grilla pareja que la vista
 * recorre sin tropiezos, y la obra completa está a un toque — al hacer clic,
 * el visor la muestra en su proporción exacta.
 */
export function Galeria({ piezas, cartela, contexto }: GaleriaProps) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const pista = useRef<HTMLUListElement>(null);
  const [pagina, setPagina] = useState(0);

  const portada = piezas[0];
  const miniaturas = piezas.slice(1);
  const total = miniaturas.length;

  /**
   * Cuántas miniaturas entran en una página de la tira.
   *
   * Empieza en «todas» y se corrige al medir. No hay parpadeo: en el teléfono
   * se ven todas de verdad, y en escritorio la tira recorta lo que sobra, así
   * que el primer cuadro ya es la primera página.
   */
  const [porPagina, setPorPagina] = useState(total);

  /**
   * Se mide en vez de calcularse: cuántos cuadrados caben depende del ancho
   * disponible, que cambia con la ventana. El observador responde también al
   * cambio de tamaño —cruzar el ancho de escritorio cambia el de la lista—,
   * así que al angostarla las flechas siguen diciendo la verdad.
   */
  useEffect(() => {
    const elemento = pista.current;
    if (!elemento) return;
    const escritorio = window.matchMedia(ESCRITORIO);

    const medir = () => {
      // En el teléfono no hay páginas: se ven todas las miniaturas.
      if (!escritorio.matches) {
        setPorPagina(total);
        return;
      }

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
  }, [total]);

  if (!portada) return null;

  const paginas = Math.max(1, Math.ceil(total / Math.max(1, porPagina)));
  // Al ensanchar la ventana caben más y sobran páginas: se acota al vuelo en
  // vez de corregir el estado desde un efecto.
  const actual = Math.min(pagina, paginas - 1);
  const visibles = miniaturas.slice(actual * porPagina, (actual + 1) * porPagina);
  const hayFlechas = paginas > 1;

  return (
    <>
      <div style={MEDIDAS} className="galeria">
        {cartela && <div className="mb-2.5 [grid-area:cartela] lg:mb-0">{cartela}</div>}

        <button
          type="button"
          onClick={() => setAbierta(0)}
          aria-label={`Ver ${portada.titulo ?? portada.alt} en grande`}
          className="block w-full min-w-0 cursor-zoom-in [grid-area:portada]"
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
        </button>

        {total > 0 && (
          <div className="flex min-w-0 items-center gap-[clamp(0.25rem,1vw,0.75rem)] [grid-area:tira]">
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
              // En el teléfono, una grilla con todas. En escritorio,
              // `grid-flow-col` llena las filas y sigue hacia la derecha en vez
              // de hacia abajo, y cada página dibuja solo sus miniaturas: así
              // la tira siempre empieza y termina en una columna entera.
              className="grid min-w-0 flex-1 grid-cols-4 gap-[var(--hueco)] sm:grid-cols-6 lg:auto-cols-[var(--lado)] lg:grid-flow-col lg:grid-cols-none lg:grid-rows-[repeat(3,var(--lado))] lg:overflow-hidden"
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
