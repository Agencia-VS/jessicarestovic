"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { urlImagen } from "@/lib/images";
import type { Exposicion } from "@/lib/data/tipos";

interface ExposicionItemProps {
  exposicion: Exposicion;
}

/**
 * Una exposición del listado: se lee como una línea de CV —año, título, lugar—
 * y se despliega para mostrar el texto y las fotos de sala (§05).
 */
export function ExposicionItem({ exposicion }: ExposicionItemProps) {
  const { titulo, lugar, anio, descripcion, fotos } = exposicion;
  const [abierta, setAbierta] = useState(false);
  const panelId = useId();

  const tieneDetalle = Boolean(descripcion) || fotos.length > 0;

  const encabezado = (
    <>
      <span className="caption w-14 shrink-0 tabular-nums text-muted">{anio ?? "—"}</span>
      <span className="flex-1 text-[1.0625rem] leading-snug">{titulo}</span>
      {lugar && <span className="caption hidden text-muted md:block">{lugar}</span>}
    </>
  );

  return (
    <li className="border-b border-line">
      {tieneDetalle ? (
        <>
          <button
            type="button"
            onClick={() => setAbierta((previo) => !previo)}
            aria-expanded={abierta}
            aria-controls={panelId}
            className="group flex w-full items-baseline gap-5 py-5 text-left transition-colors hover:text-muted"
          >
            {encabezado}
            <svg
              width="11"
              height="7"
              viewBox="0 0 11 7"
              fill="none"
              aria-hidden="true"
              className={`ml-2 shrink-0 text-faint transition-transform group-hover:text-ink ${
                abierta ? "rotate-180" : ""
              }`}
            >
              <path d="M1 1 L5.5 5.5 L10 1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>

          {abierta && (
            <div id={panelId} className="flex flex-col gap-7 pb-9">
              {lugar && <p className="caption text-muted md:hidden">{lugar}</p>}
              {descripcion && (
                <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-body text-pretty">
                  {descripcion}
                </p>
              )}

              {fotos.length > 0 && (
                <ul className="grid grid-cols-1 gap-x-9 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                  {fotos.map((foto) => (
                    <li key={foto.id} className="relative aspect-3/2 w-full">
                      <Image
                        src={urlImagen(foto.imagen_path)}
                        alt={foto.imagen_alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-baseline gap-5 py-5">{encabezado}</div>
      )}
    </li>
  );
}
