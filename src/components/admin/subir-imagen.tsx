"use client";

import { useEffect, useRef, useState } from "react";
import { borrarSubidaPendiente, prepararSubidaImagen } from "@/lib/acciones/subida-directa";
import { ayudaImagen, validarArchivo, validarDimensiones, type TipoImagen } from "@/lib/images";
import { subirArchivoPorUrl } from "@/lib/subida-directa";

interface SubirImagenProps {
  /** Nombre del campo en el formulario; la ruta se envía como `${nombre}_path`. */
  nombre: string;
  etiqueta: string;
  tipo: TipoImagen;
  /** URL de la foto que ya está guardada, si se está editando. */
  urlActual?: string | null;
  /** Al crear, la foto es obligatoria; al editar, se puede dejar la anterior. */
  requerido?: boolean;
  error?: string;
  /** El formulario padre desactiva «Guardar» mientras se suben los bytes. */
  alCambiarEstado?: (ocupado: boolean) => void;
}

interface Medidas {
  ancho: number;
  alto: number;
}

/**
 * Sube una foto directamente a Storage con una URL firmada.
 *
 * El input no tiene `name`: los bytes no se envían a la Server Action. Al
 * guardar, el formulario solo manda la ruta corta y las medidas.
 */
export function SubirImagen({
  nombre,
  etiqueta,
  tipo,
  urlActual,
  requerido = false,
  error,
  alCambiarEstado,
}: SubirImagenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const rutaPendiente = useRef<string | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [ruta, setRuta] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState(false);
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  useEffect(() => {
    alCambiarEstado?.(subiendo);
  }, [alCambiarEstado, subiendo]);

  const descartarRutaPendiente = () => {
    const anterior = rutaPendiente.current;
    rutaPendiente.current = null;
    if (anterior) void borrarSubidaPendiente(anterior, tipo);
  };

  const subir = async (archivo: File, id: number) => {
    setSubiendo(true);
    setProgreso(0);
    let rutaFirmada: string | null = null;
    try {
      const firma = await prepararSubidaImagen(tipo, archivo.type, archivo.size);
      if (id !== version.current) return;
      if ("error" in firma) {
        setProblema(firma.error);
        return;
      }

      rutaFirmada = firma.path;
      rutaPendiente.current = firma.path;
      await subirArchivoPorUrl(firma.url, archivo, setProgreso);
      if (id !== version.current) return;
      setRuta(firma.path);
      setProblema(null);
    } catch (error) {
      if (rutaFirmada) await borrarSubidaPendiente(rutaFirmada, tipo);
      if (id === version.current) {
        setProblema(
          error instanceof Error
            ? error.message
            : "No pudimos subir la foto. Revisa tu conexión y vuelve a intentar.",
        );
      }
    } finally {
      if (id === version.current) {
        rutaPendiente.current = null;
        setSubiendo(false);
      }
    }
  };

  const tomarArchivo = (archivo: File | null) => {
    const id = ++version.current;
    descartarRutaPendiente();
    setRuta(null);
    setSeleccionada(Boolean(archivo));
    setProblema(null);
    setMedidas(null);
    setProgreso(0);

    if (!archivo) {
      setPrevia(null);
      return;
    }

    const problemaArchivo = validarArchivo(archivo, tipo);
    if (problemaArchivo) {
      setProblema(problemaArchivo);
      setPrevia(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(archivo);
    setPrevia(url);

    const imagen = new Image();
    imagen.onload = () => {
      if (id !== version.current) return;
      const problemaMedidas = validarDimensiones(imagen.naturalWidth, imagen.naturalHeight, tipo);
      if (problemaMedidas) {
        setProblema(problemaMedidas);
        return;
      }
      setMedidas({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
      void subir(archivo, id);
    };
    imagen.onerror = () => {
      if (id === version.current) setProblema("No pudimos leer esa foto. Prueba con un JPG, PNG, WebP o AVIF.");
    };
    imagen.src = url;
  };

  const alSoltar = (evento: React.DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);
    const archivo = evento.dataTransfer.files?.[0] ?? null;
    if (archivo && inputRef.current) {
      const lista = new DataTransfer();
      lista.items.add(archivo);
      inputRef.current.files = lista.files;
    }
    tomarArchivo(archivo);
  };

  const mostrada = previa ?? urlActual ?? null;
  const mensaje = problema ?? error;

  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow text-muted">
        {etiqueta}
        {!requerido && <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>}
      </span>

      <input type="hidden" name={`${nombre}_path`} value={ruta ?? ""} />
      <input type="hidden" name={`${nombre}_seleccionada`} value={seleccionada ? "1" : "0"} />
      {ruta && medidas && (
        <>
          <input type="hidden" name={`${nombre}_ancho`} value={medidas.ancho} />
          <input type="hidden" name={`${nombre}_alto`} value={medidas.alto} />
        </>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-5 py-8 text-center transition-colors ${
          arrastrando ? "border-ink bg-line-soft" : "border-line hover:border-faint"
        } ${mensaje ? "border-danger" : ""}`}
      >
        {mostrada ? (
          // La vista previa es un `blob:` del archivo recién elegido, que
          // `next/image` no puede optimizar. Es una miniatura del panel.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mostrada} alt="" className="max-h-56 w-auto max-w-full object-contain" />
        ) : (
          <span className="caption text-muted">Arrastra la foto acá, o toca para elegirla</span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required={requerido && !urlActual && !ruta}
          onChange={(e) => tomarArchivo(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        <span className="caption text-ink underline underline-offset-4">
          {subiendo ? `Subiendo… ${progreso}%` : mostrada ? "Cambiar la foto" : "Elegir una foto"}
        </span>
      </label>

      {mensaje ? (
        <p role="alert" className="caption text-danger">
          {mensaje}
        </p>
      ) : (
        <p className="caption text-faint">{ayudaImagen(tipo)}</p>
      )}
    </div>
  );
}
