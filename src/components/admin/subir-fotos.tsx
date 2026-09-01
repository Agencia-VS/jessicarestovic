"use client";

import { useEffect, useState } from "react";
import { ayudaImagen, validarArchivo, validarDimensiones } from "@/lib/images";

interface Seleccion {
  archivo: File;
  previa: string;
  problema: string | null;
}

/**
 * Subida de varias fotos de sala, cada una con su descripción.
 *
 * Los archivos viven en el `input` real (`name="fotos"`, múltiple) para que
 * viajen con el formulario; acá solo mostramos la vista previa y el campo de
 * descripción de cada uno.
 */
export function SubirFotos({ nombre = "fotos" }: { nombre?: string }) {
  const [seleccion, setSeleccion] = useState<Seleccion[]>([]);

  useEffect(
    () => () => {
      for (const { previa } of seleccion) URL.revokeObjectURL(previa);
    },
    [seleccion],
  );

  const alElegir = (archivos: FileList | null) => {
    const lista = Array.from(archivos ?? []).map((archivo) => {
      const problema = validarArchivo(archivo, "exposicion");
      return { archivo, previa: URL.createObjectURL(archivo), problema };
    });

    setSeleccion(lista);

    // Validamos las medidas cuando cada imagen termina de cargar.
    lista.forEach(({ archivo, previa }, indice) => {
      const imagen = new Image();
      imagen.onload = () => {
        const problema = validarDimensiones(
          imagen.naturalWidth,
          imagen.naturalHeight,
          "exposicion",
        );
        if (!problema) return;
        setSeleccion((previaLista) =>
          previaLista.map((item, i) =>
            i === indice && item.archivo === archivo ? { ...item, problema } : item,
          ),
        );
      };
      imagen.src = previa;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-muted">
          Fotos de sala
          <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>
        </span>
        <input
          type="file"
          name={nombre}
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => alElegir(e.target.files)}
          className="caption w-full border border-dashed border-line px-4 py-3 text-muted file:mr-4 file:border-0 file:bg-transparent file:text-ink"
        />
        <span className="caption text-faint">{ayudaImagen("exposicion")}</span>
      </label>

      {seleccion.length > 0 && (
        <ul className="flex flex-col gap-5">
          {seleccion.map(({ archivo, previa, problema }, indice) => (
            <li key={`${archivo.name}-${indice}`} className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previa} alt="" className="h-24 w-32 shrink-0 object-cover" />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label className="caption text-muted" htmlFor={`foto_alt_${indice}`}>
                  Descripción de esta foto
                </label>
                <input
                  id={`foto_alt_${indice}`}
                  type="text"
                  name={`foto_alt_${indice}`}
                  placeholder="Vista de sala, montaje…"
                  className="w-full border-b border-line bg-transparent py-2 text-sm placeholder:text-faint focus:border-ink focus:outline-none"
                />
                {problema && (
                  <p role="alert" className="caption text-danger">
                    {problema}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
