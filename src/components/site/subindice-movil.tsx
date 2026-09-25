"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface SubindiceMovilProps {
  seccion: string;
  base: string;
  todos: string;
  grupos: { slug: string; titulo: string }[];
  activo: string | null;
}

/**
 * La fila de muestras —o de conjuntos— plegada en una sola línea, para el
 * teléfono: «Exposiciones ⌄».
 *
 * En escritorio la fila entera cabe sobre el contenido. En el teléfono ocupaba
 * tres líneas antes de la primera foto, así que se recoge en la cabecera y se
 * abre con un toque, como una lista de filas altas y fáciles de tocar.
 *
 * Se cierra con Escape, tocando fuera o eligiendo una opción. La lista va
 * sobre la página, sin empujarla, para que abrirla no mueva lo que se estaba
 * mirando.
 */
export function SubindiceMovil({ seccion, base, todos, grupos, activo }: SubindiceMovilProps) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    // Se escucha en `window` y en captura para llegar antes que la página: un
    // toque fuera de la lista solo la cierra, y no abre además la foto que
    // había debajo. Dentro de la cabecera el toque sí sigue su curso, para que
    // el «+» abra el menú a la primera.
    const alTocar = (evento: MouseEvent) => {
      const destino = evento.target as Node;
      if (raiz.current?.contains(destino)) return;
      setAbierto(false);
      if (!raiz.current?.closest("header")?.contains(destino)) {
        evento.preventDefault();
        evento.stopPropagation();
      }
    };

    document.addEventListener("keydown", alTeclear);
    window.addEventListener("click", alTocar, { capture: true });
    return () => {
      document.removeEventListener("keydown", alTeclear);
      window.removeEventListener("click", alTocar, { capture: true });
    };
  }, [abierto]);

  const opciones = [
    { slug: null, titulo: todos, href: base },
    ...grupos.map(({ slug, titulo }) => ({ slug, titulo, href: `${base}/${slug}` })),
  ];

  return (
    <div ref={raiz}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-controls="subindice-movil"
        className="eyebrow flex min-h-11 items-center gap-2 text-ink"
      >
        {seccion}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <nav
        id="subindice-movil"
        aria-label={seccion}
        hidden={!abierto}
        className="gutter absolute inset-x-0 top-full border-b border-line bg-paper pt-2 pb-4"
      >
        {opciones.map(({ slug, titulo, href }) => {
          const seleccionado = slug === activo;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setAbierto(false)}
              aria-current={seleccionado ? "page" : undefined}
              className={`flex min-h-11 items-center text-[0.9375rem] leading-snug font-light ${
                seleccionado ? "text-ink" : "text-muted"
              }`}
            >
              <span className={seleccionado ? "border-b border-accent pb-[3px]" : undefined}>
                {titulo}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
