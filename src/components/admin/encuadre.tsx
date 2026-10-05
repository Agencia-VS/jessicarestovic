"use client";

import { useRef, useState } from "react";

interface EncuadreProps {
  /** La foto a encuadrar: la recién elegida o la que ya está guardada. */
  url: string | null;
  /** El campo con el que el foco viaja en el formulario. */
  nombre: string;
  /** Qué parte se ve: 0 es la de arriba y 100, la de abajo. */
  foco: number;
  alCambiar: (foco: number) => void;
}

/** Atajos a las tres partes de la foto, en el orden en que se leen. */
const ATAJOS = [
  { etiqueta: "Arriba", foco: 0 },
  { etiqueta: "Centro", foco: 50 },
  { etiqueta: "Abajo", foco: 100 },
] as const;

/** El foco en palabras, para el lector de pantalla. */
function enPalabras(foco: number): string {
  if (foco <= 10) return "La parte de arriba";
  if (foco >= 90) return "La parte de abajo";
  if (foco >= 40 && foco <= 60) return "El centro";
  return foco < 50 ? "Entre arriba y el centro" : "Entre el centro y abajo";
}

/**
 * Elige qué parte de la foto grande se ve en el Inicio.
 *
 * Muestra la franja tal como se verá en el computador —tres veces más ancha
 * que alta— con la foto adentro. La foto se arrastra hacia arriba o hacia
 * abajo, como al acomodar la foto de portada de una red social; la barra hace
 * lo mismo, también con el teclado, y los atajos llevan a la parte de arriba,
 * al centro o a la de abajo de un toque.
 */
export function Encuadre({ url, nombre, foco, alCambiar }: EncuadreProps) {
  const marco = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ y: number; foco: number; recorrido: number } | null>(null);
  /** La foto es tan ancha que entra entera en la franja: no hay nada que elegir. */
  const [entera, setEntera] = useState(false);

  const empezar = (evento: React.PointerEvent<HTMLDivElement>) => {
    const caja = marco.current;
    const foto = caja?.querySelector("img");
    if (!caja || !foto?.naturalWidth) return;
    // Lo que la foto sobresale de la franja, en píxeles de pantalla: es todo
    // lo que se puede recorrer de arriba abajo.
    const escala = Math.max(
      caja.clientWidth / foto.naturalWidth,
      caja.clientHeight / foto.naturalHeight,
    );
    const recorrido = foto.naturalHeight * escala - caja.clientHeight;
    if (recorrido <= 0) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrastre.current = { y: evento.clientY, foco, recorrido };
  };

  const mover = (evento: React.PointerEvent<HTMLDivElement>) => {
    const inicio = arrastre.current;
    if (!inicio) return;
    // La foto sigue al dedo: bajarla deja ver lo que tiene más arriba.
    const nuevo = inicio.foco - ((evento.clientY - inicio.y) / inicio.recorrido) * 100;
    alCambiar(Math.round(Math.min(100, Math.max(0, nuevo))));
  };

  const soltar = () => {
    arrastre.current = null;
  };

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={nombre} value={foco} />
      <span className="eyebrow text-muted">Qué parte se ve</span>

      {url ? (
        <>
          <div
            ref={marco}
            onPointerDown={empezar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            className={`relative aspect-[3/1] w-full overflow-hidden bg-line-soft select-none ${
              entera ? "" : "cursor-grab touch-pan-x active:cursor-grabbing"
            }`}
          >
            {/* Puede ser el `blob:` de la foto recién elegida, que `next/image`
                no sabe optimizar. Es una vista previa del panel. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={(evento) => {
                const foto = evento.currentTarget;
                setEntera(foto.naturalWidth / foto.naturalHeight >= 3);
              }}
              style={{ objectPosition: `50% ${foco}%` }}
              className="h-full w-full object-cover"
            />
          </div>

          {entera ? (
            <p className="caption text-faint">
              La foto es tan ancha que entra entera en la franja: se ve completa.
            </p>
          ) : (
            <>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={foco}
                onChange={(evento) => alCambiar(Number(evento.target.value))}
                aria-label="Qué parte de la foto se ve"
                aria-valuetext={enPalabras(foco)}
                className="w-full accent-ink"
              />
              <div className="flex justify-between">
                {ATAJOS.map((atajo) => (
                  <button
                    key={atajo.etiqueta}
                    type="button"
                    onClick={() => alCambiar(atajo.foco)}
                    aria-pressed={foco === atajo.foco}
                    className="caption text-muted underline-offset-4 transition-colors hover:text-ink aria-pressed:text-ink aria-pressed:underline"
                  >
                    {atajo.etiqueta}
                  </button>
                ))}
              </div>
              <p className="caption text-faint">
                Arrastra la foto o mueve la barra. Así se ve en el computador; en el
                teléfono la foto aparece entera.
              </p>
            </>
          )}
        </>
      ) : (
        <p className="caption text-faint">Cuando subas la foto, acá eliges qué parte se ve.</p>
      )}
    </div>
  );
}
