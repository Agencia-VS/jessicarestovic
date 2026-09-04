"use client";

import { useId } from "react";

const CONTROL =
  "w-full border-0 border-b border-rule bg-transparent py-2.5 text-[0.9375rem] font-light " +
  "text-ink transition-colors outline-none placeholder:text-faint hover:border-faint " +
  "focus:border-ink aria-invalid:border-danger";

interface CampoLineaProps {
  /** Se ve como marcador dentro del campo y lo nombra para el lector de pantalla. */
  etiqueta: string;
  nombre: string;
  error?: string;
  requerido?: boolean;
  /** Varias líneas, para el mensaje. */
  area?: boolean;
  rows?: number;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  defaultValue?: string;
}

/**
 * El campo de los formularios del sitio: una línea y nada más, como en el
 * diseño. La etiqueta existe pero solo para quien usa lector de pantalla —
 * visible sería una palabra de más en una página que apuesta por lo esencial.
 */
export function CampoLinea({
  etiqueta,
  nombre,
  error,
  requerido = false,
  area = false,
  rows = 3,
  type = "text",
  autoComplete,
  defaultValue,
}: CampoLineaProps) {
  const id = useId();
  const idError = `${id}-error`;

  const comunes = {
    id,
    name: nombre,
    required: requerido,
    placeholder: etiqueta,
    autoComplete,
    defaultValue,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? idError : undefined,
  } as const;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
        {!requerido && " (opcional)"}
      </label>

      {area ? (
        <textarea {...comunes} rows={rows} className={`${CONTROL} resize-y leading-relaxed`} />
      ) : (
        <input {...comunes} type={type} className={CONTROL} />
      )}

      {error && (
        <p id={idError} className="ficha text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
