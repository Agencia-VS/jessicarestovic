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
 * en la tableta y 124 px como mucho en la tira de escritorio (`--lado`).
 */
const SIZES_MINIATURA = "(max-width: 40rem) 25vw, (max-width: 64rem) 17vw, 124px";

/** Desde dónde la galería es una fila, con la portada y la tira lado a lado. */
const ESCRITORIO = "(min-width: 64rem)";

/**
 * El lado de cada miniatura y el aire entre ellas.
 *
 * Son variables de CSS y no números sueltos porque de ellas sale también el
 * alto de la tira —tres cuadrados más sus huecos— y con ese alto se topa la
 * portada. Así las dos columnas terminan a la misma altura sin que nadie mida
 * nada a mano.
 *
 * El tope del lado es el que deja seis columnas en la tira del canvas más
 * ancho. Con 8rem cabían cinco, y en cualquier pantalla de más de 1500 px
 * quedaba una columna vacía a la derecha de la tira.
 */
const MEDIDAS = {
  "--lado": "clamp(4.5rem, 8.5vw, 7.75rem)",
  "--hueco": "clamp(0.375rem, 0.9vw, 0.75rem)",
} as React.CSSProperties;

/** Cómo se reparte la tira de escritorio, medida en el navegador. */
interface Reparto {
  /** Cuántas columnas de miniaturas entran en una página. */
  columnas: number;
  /** Cuántas filas tiene la tira: las miniaturas la llenan columna a columna. */
  filas: number;
  /** El ancho exacto de una página: sus columnas y los huecos entre ellas. */
  ancho: number;
  /** Lo que ocupa una columna con su hueco: la unidad en que se corre la pista. */
  columna: number;
}

/**
 * Una galería: la pintura principal, su cartela y las miniaturas cuadradas.
 *
 * En escritorio va todo en una fila: la portada y su cartela en el primer
 * tercio, y la tira en los otros dos. Cuando hay muchas piezas la tira no
 * crece hacia abajo: llena tres filas y avanza **con flechas, de página en
 * página**. El desplazamiento libre no gustó: en un trackpad se pasa de largo
 * y sin una flecha a la vista nada anuncia que hay más.
 *
 * Al pasar de página la tira se desliza de lado, con la misma curva suave del
 * visor, en vez de cambiar de golpe: así se entiende que las miniaturas que
 * entran venían a continuación de las que salen. La última página no deja
 * columnas vacías: se apoya en el final de la tira y repite las últimas de la
 * anterior, así la flecha › queda siempre a la misma distancia.
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
  const [pagina, setPagina] = useState(0);
  const tira = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  /** Cómo se reparte la tira; `null` en el teléfono, que no tiene páginas. */
  const [reparto, setReparto] = useState<Reparto | null>(null);

  const portada = piezas[0];
  const miniaturas = piezas.slice(1);
  const total = miniaturas.length;

  /**
   * Se mide en vez de calcularse: cuántas columnas caben depende del ancho que
   * dejan las flechas, que cambia con la ventana. El observador responde
   * también al cambio de tamaño —cruzar el ancho de escritorio cambia el de la
   * tira—, así que al angostarla las flechas siguen diciendo la verdad. Mira
   * además las flechas, que son texto: cambian de ancho cuando llega la
   * tipografía, sin que la tira cambie.
   */
  useEffect(() => {
    const contenedor = tira.current;
    const elemento = lista.current;
    if (!contenedor || !elemento) return;
    const escritorio = window.matchMedia(ESCRITORIO);

    const botones = [
      ...contenedor.querySelectorAll<HTMLElement>('button[aria-label^="Miniaturas"]'),
    ];

    const medir = () => {
      // En el teléfono no hay páginas: se ven todas las miniaturas.
      if (!escritorio.matches) {
        setReparto(null);
        return;
      }

      const lado = elemento.querySelector("li")?.getBoundingClientRect().width ?? 0;
      if (lado === 0 || contenedor.clientWidth === 0) return;

      const estilo = getComputedStyle(elemento);
      const hueco = Number.parseFloat(estilo.columnGap) || 0;
      const filas = estilo.gridTemplateRows.split(" ").filter(Boolean).length;
      // El ancho entre las dos flechas, que ocupan su lugar aunque no se vean.
      const separacion = Number.parseFloat(getComputedStyle(contenedor).columnGap) || 0;
      const flechas = botones.reduce((suma, flecha) => suma + flecha.offsetWidth + separacion, 0);
      const columnas = Math.max(
        1,
        Math.floor((contenedor.clientWidth - flechas + hueco) / (lado + hueco)),
      );

      const nuevo = {
        columnas,
        filas,
        ancho: columnas * lado + (columnas - 1) * hueco,
        columna: lado + hueco,
      };
      setReparto((previo) =>
        previo &&
        previo.columnas === nuevo.columnas &&
        previo.filas === nuevo.filas &&
        previo.ancho === nuevo.ancho &&
        previo.columna === nuevo.columna
          ? previo
          : nuevo,
      );
    };

    const observador = new ResizeObserver(medir);
    observador.observe(contenedor);
    for (const flecha of botones) observador.observe(flecha);
    return () => observador.disconnect();
  }, [total]);

  if (!portada) return null;

  const columnasTotales = reparto ? Math.ceil(total / reparto.filas) : 0;
  const paginas = reparto ? Math.max(1, Math.ceil(columnasTotales / reparto.columnas)) : 1;
  // Al ensanchar la ventana caben más y sobran páginas: se acota al vuelo en
  // vez de corregir el estado desde un efecto.
  const actual = Math.min(pagina, paginas - 1);
  const hayFlechas = paginas > 1;
  // La primera columna a la vista. La última página se apoya en el final de
  // la tira en vez de quedar con columnas vacías.
  const primera = reparto
    ? Math.max(0, Math.min(actual * reparto.columnas, columnasTotales - reparto.columnas))
    : 0;
  const corrimiento = reparto ? primera * reparto.columna : 0;
  /** Si la miniatura cae en las columnas a la vista; en el teléfono, todas. */
  const aLaVista = (indice: number) => {
    if (!reparto) return true;
    const columna = Math.floor(indice / reparto.filas);
    return columna >= primera && columna < primera + reparto.columnas;
  };

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
            // El tope de escritorio es el alto de la tira: ahí las dos columnas
            // tienen que terminar a la misma altura. En el teléfono, apiladas,
            // toparla así dejaba la pintura principal en 150 px — una
            // estampilla. Se topa el ancho, a partir del alto y la proporción,
            // y no el alto: así el marco mide lo mismo que la foto y el tono
            // que se ve mientras carga no queda más ancho que la obra.
            className="w-[min(100%,calc(60vh*var(--r)))] lg:w-[min(100%,calc((3*var(--lado)+2*var(--hueco))*var(--r)))]"
          />
        </button>

        {total > 0 && (
          <div
            ref={tira}
            className="flex min-w-0 items-center gap-[clamp(0.25rem,1vw,0.75rem)] [grid-area:tira]"
          >
            {/* Las flechas ocupan su lugar aunque haya una sola página: así la
                tira no se corre cuando aparecen, y lo que queda entre ellas es
                un ancho fijo con el que se calculan las columnas. */}
            <span className="hidden lg:contents">
              <Paso
                direccion="anterior"
                onClick={() => setPagina(actual - 1)}
                desactivado={actual === 0}
                oculto={!hayFlechas}
                rotulo="Miniaturas"
              />
            </span>

            {/* La ventana mide exactamente una página. Antes llenaba todo el
                espacio entre las flechas y las miniaturas solo ocupaban
                columnas enteras: lo que sobraba quedaba a la derecha, y la
                flecha derecha terminaba hasta diez veces más lejos que la
                izquierda. */}
            <div
              className="min-w-0 flex-1 lg:overflow-hidden"
              style={reparto ? { flex: "none", width: reparto.ancho } : undefined}
            >
              <ul
                ref={lista}
                // En el teléfono, una grilla con todas. En escritorio,
                // `grid-flow-col` llena las filas y sigue hacia la derecha, y
                // la pista entera se corre de a columnas enteras —una página,
                // o lo que falte para llegar al final—, así nunca asoma una
                // astilla de la vecina.
                className="grid grid-cols-4 gap-[var(--hueco)] sm:grid-cols-6 lg:auto-cols-[var(--lado)] lg:grid-flow-col lg:grid-cols-none lg:grid-rows-[repeat(3,var(--lado))] lg:transition-transform lg:duration-500 lg:ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={corrimiento ? { transform: `translateX(-${corrimiento}px)` } : undefined}
              >
                {miniaturas.map((pieza, indice) => (
                  <li
                    key={pieza.id}
                    // Las de otras páginas siguen en la pista —es lo que permite
                    // deslizarla— pero fuera del alcance del teclado y del
                    // lector de pantalla mientras no se ven.
                    inert={!aLaVista(indice)}
                  >
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
            </div>

            <span className="hidden lg:contents">
              <Paso
                direccion="siguiente"
                onClick={() => setPagina(actual + 1)}
                desactivado={actual >= paginas - 1}
                oculto={!hayFlechas}
                rotulo="Miniaturas"
              />
            </span>
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
