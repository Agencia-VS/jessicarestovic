"use client";

import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [seleccion, setSeleccion] = useState<Seleccion[]>([]);
  const [arrastrando, setArrastrando] = useState(false);

  /** Las fotos soltadas se dejan en el input real para que viajen con el form. */
  const alSoltar = (evento: React.DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);

    const archivos = evento.dataTransfer.files;
    if (!archivos?.length || !inputRef.current) return;

    const lista = new DataTransfer();
    for (const archivo of archivos) lista.items.add(archivo);
    inputRef.current.files = lista.files;
    alElegir(lista.files);
  };

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
      <span className="eyebrow text-muted">
        Fotos de sala
        <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>
      </span>

      {/* Misma zona de arrastre que el formulario de obra, para que subir
          fotos se sienta igual en todo el panel. */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-5 py-8 text-center transition-colors ${
          arrastrando ? "border-ink bg-line-soft" : "border-line hover:border-faint"
        }`}
      >
        <span className="caption text-muted">
          {seleccion.length > 0
            ? `${seleccion.length} ${seleccion.length === 1 ? "foto elegida" : "fotos elegidas"}`
            : "Arrastra las fotos acá, o toca para elegirlas"}
        </span>

        <input
          ref={inputRef}
          type="file"
          name={nombre}
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => alElegir(e.target.files)}
          className="sr-only"
        />

        <span className="caption text-ink underline underline-offset-4">
          {seleccion.length > 0 ? "Elegir otras" : "Elegir fotos"}
        </span>
      </label>
      <span className="caption text-faint">{ayudaImagen("exposicion")}</span>

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
