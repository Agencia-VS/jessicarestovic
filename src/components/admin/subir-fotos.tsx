"use client";

import { useEffect, useRef, useState } from "react";
import { borrarSubidaPendiente, prepararSubidaImagen } from "@/lib/acciones/subida-directa";
import { advertirDimensiones, ayudaImagen, validarArchivo } from "@/lib/images";
import { subirArchivoPorUrl } from "@/lib/subida-directa";

interface Seleccion {
  archivo: File;
  previa: string;
  problema: string | null;
  advertencia: string | null;
  medidas: { ancho: number; alto: number } | null;
  ruta: string | null;
  progreso: number;
  subiendo: boolean;
}

interface SubirFotosProps {
  nombre?: string;
  /** El formulario padre desactiva «Guardar» hasta completar todas las fotos. */
  alCambiarEstado?: (ocupado: boolean) => void;
}

/**
 * Sube varias fotos de sala directamente a Storage. El formulario solo manda
 * una ruta y los metadatos por cada foto; nunca manda el File a Vercel.
 */
export function SubirFotos({ nombre = "fotos", alCambiarEstado }: SubirFotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const seleccionActual = useRef<Seleccion[]>([]);
  const [seleccion, setSeleccion] = useState<Seleccion[]>([]);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    seleccionActual.current = seleccion;
  }, [seleccion]);

  useEffect(() => {
    alCambiarEstado?.(seleccion.some((item) => !item.ruta));
  }, [alCambiarEstado, seleccion]);

  useEffect(() => {
    return () => {
      for (const item of seleccionActual.current) URL.revokeObjectURL(item.previa);
    };
  }, []);

  const actualizar = (indice: number, cambio: Partial<Seleccion>) => {
    setSeleccion((previa) =>
      previa.map((item, i) => (i === indice ? { ...item, ...cambio } : item)),
    );
  };

  const subir = async (item: Seleccion, indice: number, id: number) => {
    actualizar(indice, { subiendo: true, progreso: 0 });
    let rutaFirmada: string | null = null;
    try {
      const firma = await prepararSubidaImagen("exposicion", item.archivo.type, item.archivo.size);
      if (id !== version.current) {
        if (!("error" in firma)) await borrarSubidaPendiente(firma.path, "exposicion");
        return;
      }
      if ("error" in firma) {
        actualizar(indice, { problema: firma.error, subiendo: false });
        return;
      }

      rutaFirmada = firma.path;
      await subirArchivoPorUrl(firma.url, item.archivo, (progreso) => {
        if (id === version.current) actualizar(indice, { progreso });
      });
      if (id === version.current) actualizar(indice, { ruta: firma.path, subiendo: false, progreso: 100 });
    } catch (error) {
      if (rutaFirmada) await borrarSubidaPendiente(rutaFirmada, "exposicion");
      if (id === version.current) {
        actualizar(indice, {
          problema:
            error instanceof Error
              ? error.message
              : "No pudimos subir esta foto. Revisa tu conexión y vuelve a intentar.",
          subiendo: false,
        });
      }
    }
  };

  const alElegir = (archivos: FileList | null) => {
    const id = ++version.current;
    const anterior = seleccion;
    for (const item of anterior) {
      URL.revokeObjectURL(item.previa);
      if (item.ruta) void borrarSubidaPendiente(item.ruta, "exposicion");
    }

    const lista = Array.from(archivos ?? []).map((archivo) => ({
      archivo,
      previa: URL.createObjectURL(archivo),
      problema: validarArchivo(archivo, "exposicion"),
      advertencia: null,
      medidas: null,
      ruta: null,
      progreso: 0,
      subiendo: false,
    } satisfies Seleccion));
    setSeleccion(lista);

    lista.forEach((item, indice) => {
      if (item.problema) return;
      const imagen = new Image();
      imagen.onload = () => {
        if (id !== version.current) return;
        const ancho = imagen.naturalWidth;
        const alto = imagen.naturalHeight;
        actualizar(indice, {
          advertencia: advertirDimensiones(ancho, alto, "exposicion"),
          medidas: { ancho, alto },
        });
        void subir(item, indice, id);
      };
      imagen.onerror = () => {
        if (id === version.current) {
          actualizar(indice, { problema: "No pudimos leer esa foto. Prueba con un JPG, PNG, WebP o AVIF." });
        }
      };
      imagen.src = item.previa;
    });
  };

  const alSoltar = (evento: React.DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);
    alElegir(evento.dataTransfer.files);
  };

  const haySubida = seleccion.some((item) => item.subiendo);

  return (
    <div className="flex flex-col gap-4">
      <span className="eyebrow text-muted">
        Fotos de sala
        <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>
      </span>

      <input type="hidden" name={`${nombre}_count`} value={seleccion.length} />
      {seleccion.map((item, indice) => (
        <input key={`ruta-${indice}`} type="hidden" name={`${nombre}_path_${indice}`} value={item.ruta ?? ""} />
      ))}

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
      <p className="caption text-faint">
        Son las fotos del montaje. Las obras se suben en «Trabajos recientes».
      </p>
      {haySubida && <p className="caption text-muted">Subiendo fotos…</p>}

      {seleccion.length > 0 && (
        <ul className="flex flex-col gap-5">
          {seleccion.map((item, indice) => (
            <li key={`${item.archivo.name}-${indice}`} className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previa} alt="" className="h-24 w-32 shrink-0 object-cover" />

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
                {item.ruta && item.medidas && (
                  <>
                    <input type="hidden" name={`foto_ancho_${indice}`} value={item.medidas.ancho} />
                    <input type="hidden" name={`foto_alto_${indice}`} value={item.medidas.alto} />
                  </>
                )}
                {item.subiendo && <p className="caption text-muted">Subiendo… {item.progreso}%</p>}
                {item.problema && (
                  <p role="alert" className="caption text-danger">
                    {item.problema}
                  </p>
                )}
                {item.advertencia && (
                  <p className="caption text-muted">{item.advertencia}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
