"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Foto } from "./foto";
import type { PiezaAmpliada } from "./piezas";

interface LightboxProps {
  /** La secuencia que recorre el visor: el conjunto visible. */
  piezas: PiezaAmpliada[];
  /** Índice de la foto abierta, o `null` si está cerrado. */
  indice: number | null;
  onCerrar: () => void;
  onCambiar: (indice: number) => void;
}

/**
 * Cuánto esperar, sin que el scroll se mueva, para dar la foto por elegida.
 *
 * El desplazamiento suave dispara `scroll` decenas de veces por segundo y a
 * media transición el cálculo da una foto intermedia. Con esta pausa el índice
 * se actualiza una sola vez, cuando la foto ya quedó puesta.
 */
const REPOSO = 120;

/**
 * Vista ampliada de una foto. Es una capa sobre la página, no una página
 * aparte (§05), así que el visitante no pierde el lugar donde iba.
 *
 * Las fotos van en una pista que se desplaza de lado. No es una decisión
 * estética: el desplazamiento lo hace el navegador, así que el gesto del dedo
 * en el teléfono, el de dos dedos en el trackpad y la rueda del mouse
 * funcionan solos, con su inercia y su rebote de siempre. Antes había un
 * manejador de arrastre escrito a mano que solo entendía el dedo.
 *
 * `scroll-snap` es lo que hace que la pista se detenga siempre en una foto y
 * nunca entre dos.
 *
 * Al tocar la foto, se amplía al doble y se puede recorrer arrastrando. Con el
 * zoom puesto la pista deja de desplazarse de lado, para que mirar un detalle
 * no cambie de foto sin querer.
 *
 * Recorre solo la secuencia con la que se abrió —las piezas de ese conjunto,
 * las vistas de esa muestra, las tres del Inicio— y acá la proporción es
 * exacta: sin el tope de la retícula ni el cuadrado de la miniatura, la foto
 * se ve tal como es.
 */
export function Lightbox({ piezas, indice, onCerrar, onCambiar }: LightboxProps) {
  const abierto = indice !== null;
  const pieza = indice !== null ? piezas[indice] : undefined;
  const pista = useRef<HTMLDivElement>(null);
  /**
   * En qué foto está puesto el zoom, no si está puesto.
   *
   * Guardar el índice y no un booleano hace que cambiar de foto lo suelte
   * solo: al pasar a la siguiente, `zoomEn` ya no coincide y la foto se ve
   * completa. Con un booleano había que apagarlo desde un efecto, que es
   * justo lo que no conviene hacer.
   */
  const [zoomEn, setZoomEn] = useState<number | null>(null);
  const ampliada = indice !== null && zoomEn === indice;
  /** La primera colocación es instantánea; el resto, suave. */
  const yaColocada = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const irA = useCallback(
    (salto: number) => {
      if (indice === null || piezas.length === 0) return;
      onCambiar((indice + salto + piezas.length) % piezas.length);
    },
    [indice, piezas.length, onCambiar],
  );

  useEffect(() => {
    if (!abierto) {
      yaColocada.current = false;
      return;
    }

    const alPresionar = (evento: KeyboardEvent) => {
      // Escape sale primero del zoom y recién después cierra: es el orden en
      // que uno deshace lo último que hizo.
      if (evento.key === "Escape") {
        if (ampliada) setZoomEn(null);
        else onCerrar();
      }
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
  }, [abierto, ampliada, irA, onCerrar]);

  // El índice manda sobre la pista: al abrir coloca la foto elegida, y cuando
  // se usa una flecha o el teclado, lleva la pista hasta ella.
  useEffect(() => {
    const elemento = pista.current;
    if (!elemento || indice === null || elemento.clientWidth === 0) return;

    const objetivo = indice * elemento.clientWidth;
    // Si la pista ya está ahí, el cambio vino de desplazarse: no hay que
    // moverla de nuevo, y hacerlo cortaría la inercia del dedo.
    if (Math.abs(elemento.scrollLeft - objetivo) < 2) return;

    elemento.scrollTo({ left: objetivo, behavior: yaColocada.current ? "smooth" : "auto" });
    yaColocada.current = true;
  }, [indice, abierto]);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  if (!abierto || !pieza) return null;

  const alDesplazar = () => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const elemento = pista.current;
      if (!elemento || elemento.clientWidth === 0) return;
      const actual = Math.round(elemento.scrollLeft / elemento.clientWidth);
      if (actual !== indice && actual >= 0 && actual < piezas.length) onCambiar(actual);
    }, REPOSO);
  };

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
        <div className="flex items-baseline gap-5">
          <button
            type="button"
            onClick={() => setZoomEn(ampliada ? null : indice)}
            aria-pressed={ampliada}
            className="eyebrow border-b border-rule-soft pb-[3px] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            {ampliada ? "Alejar" : "Acercar"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="eyebrow border-b border-rule-soft pb-[3px] tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-[clamp(0.625rem,2vw,1.75rem)] px-[clamp(0.875rem,3vw,2.5rem)]">
        {piezas.length > 1 && !ampliada && <Paso direccion="anterior" onClick={() => irA(-1)} />}

        <div
          ref={pista}
          onScroll={alDesplazar}
          className={`flex h-full min-w-0 flex-1 ${
            ampliada
              ? "overflow-hidden"
              : "snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {piezas.map((cada, posicion) => (
            <div
              key={cada.id}
              className={`flex h-full w-full shrink-0 snap-center items-center justify-center ${
                ampliada && posicion === indice ? "overflow-auto" : "overflow-hidden"
              }`}
            >
              {/* Solo la foto a la vista es interactiva. Las demás siguen en el
                  documento —es lo que permite desplazarse de lado— pero fuera
                  del recorrido del teclado y del lector de pantalla: sin esto
                  había treinta y cuatro botones «Acercar la foto», y tabular
                  hasta uno que no se ve arrastraba la pista hasta él. */}
              <button
                type="button"
                onClick={() => setZoomEn(ampliada ? null : posicion)}
                tabIndex={posicion === indice ? 0 : -1}
                aria-hidden={posicion !== indice}
                aria-label={ampliada ? "Alejar la foto" : "Acercar la foto"}
                className={`flex shrink-0 items-center justify-center ${
                  ampliada ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
              >
                <Foto
                  src={cada.imagenUrl}
                  alt={cada.alt}
                  ancho={cada.ancho}
                  alto={cada.alto}
                  variante="exacta"
                  sizes="(max-width: 48rem) 100vw, 80vw"
                  prioridad={posicion === indice}
                  // El doble del alto en que la foto entra completa: el
                  // marco se agranda y el contenedor de arriba, con overflow,
                  // es el que deja recorrerla.
                  className={
                    ampliada && posicion === indice
                      ? "h-[min(144vh,107.5rem)] w-auto max-w-none shrink-0"
                      : "h-[min(72vh,53.75rem)] max-h-full w-auto max-w-full shrink-0"
                  }
                />
              </button>
            </div>
          ))}
        </div>

        {piezas.length > 1 && !ampliada && <Paso direccion="siguiente" onClick={() => irA(1)} />}
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

/** Las flechas: tipografía del sitio, no un icono. */
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
