"use client";

import { useEffect, useRef, useState } from "react";
import { ayudaImagen, urlImagen, validarArchivo, validarDimensiones, type TipoImagen } from "@/lib/images";

interface SubirImagenProps {
  /** Nombre del campo en el formulario. */
  nombre: string;
  etiqueta: string;
  tipo: TipoImagen;
  /** Ruta de la foto que ya está guardada, si se está editando. */ 
  pathActual?: string | null;
  /** Al crear, la foto es obligatoria; al editar, se puede dejar la anterior. */
  requerido?: boolean;
  error?: string;
}

interface Medidas {
  ancho: number;
  alto: number;
}

/**
 * Subida de una foto: se arrastra el archivo o se elige del celular, y aparece
 * la vista previa al instante (§07, pasos 2 y «Editar una foto existente»).
 *
 * La validación ocurre acá, en el navegador, para avisar antes de que Jessica
 * espere una subida que iba a fallar. El servidor vuelve a validar de todas
 * formas.
 */
export function SubirImagen({
  nombre,
  etiqueta,
  tipo,
  pathActual,
  requerido = false,
  error,
}: SubirImagenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Liberamos la URL de la vista previa al reemplazarla o desmontar.
  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  const tomarArchivo = (archivo: File | null) => {
    setProblema(null);
    setMedidas(null);

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

    // Leemos el tamaño real para validarlo y para guardarlo con la obra.
    const imagen = new Image();
    imagen.onload = () => {
      const problemaMedidas = validarDimensiones(imagen.naturalWidth, imagen.naturalHeight, tipo);
      if (problemaMedidas) {
        setProblema(problemaMedidas);
        return;
      }
      setMedidas({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    };
    imagen.src = url;
  };

  const alSoltar = (evento: React.DragEvent) => {
    evento.preventDefault();
    setArrastrando(false);
    const archivo = evento.dataTransfer.files?.[0] ?? null;
    if (archivo && inputRef.current) {
      // Dejamos el archivo en el input para que viaje con el formulario.
      const lista = new DataTransfer();
      lista.items.add(archivo);
      inputRef.current.files = lista.files;
    }
    tomarArchivo(archivo);
  };

  const mostrada = previa ?? (pathActual ? urlImagen(pathActual) : null);
  const mensaje = problema ?? error;

  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow text-muted">
        {etiqueta}
        {!requerido && <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>}
      </span>

      {/* Las medidas viajan al servidor para reservar el espacio en la retícula. */}
      {medidas && (
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
          // `next/image` no puede optimizar. Es una miniatura del panel, no
          // parte del sitio público.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mostrada}
            alt=""
            className="max-h-56 w-auto max-w-full object-contain"
          />
        ) : (
          <span className="caption text-muted">
            Arrastra la foto acá, o toca para elegirla
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          name={nombre}
          accept="image/jpeg,image/png,image/webp,image/avif"
          required={requerido && !pathActual}
          onChange={(e) => tomarArchivo(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        <span className="caption text-ink underline underline-offset-4">
          {mostrada ? "Cambiar la foto" : "Elegir una foto"}
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
