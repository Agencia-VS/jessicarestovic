"use client";

import { useId } from "react";

interface CampoBaseProps {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
}

type CampoProps = CampoBaseProps &
  Omit<React.ComponentPropsWithoutRef<"input">, "name" | "id" | "className">;

const CLASES_CONTROL =
  "w-full border-b border-line bg-transparent py-2.5 text-[0.9375rem] text-ink " +
  "transition-colors placeholder:text-faint hover:border-faint focus:border-ink focus:outline-none " +
  "aria-invalid:border-danger";

/** Campo de texto de una línea. */
export function Campo({ etiqueta, nombre, error, ayuda, requerido, ...resto }: CampoProps) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow text-muted">
        {etiqueta}
        {!requerido && <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>}
      </label>
      <input
        {...resto}
        id={id}
        name={nombre}
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && idError, ayuda && idAyuda].filter(Boolean).join(" ") || undefined}
        className={CLASES_CONTROL}
      />
      {ayuda && !error && (
        <p id={idAyuda} className="caption text-faint">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type AreaProps = CampoBaseProps &
  Omit<React.ComponentPropsWithoutRef<"textarea">, "name" | "id" | "className">;

/** Campo de texto de varias líneas. */
export function Area({ etiqueta, nombre, error, ayuda, requerido, rows = 5, ...resto }: AreaProps) {
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow text-muted">
        {etiqueta}
        {!requerido && <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>}
      </label>
      <textarea
        {...resto}
        id={id}
        name={nombre}
        rows={rows}
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && idError, ayuda && idAyuda].filter(Boolean).join(" ") || undefined}
        className={`${CLASES_CONTROL} resize-y leading-relaxed`}
      />
      {ayuda && !error && (
        <p id={idAyuda} className="caption text-faint">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends CampoBaseProps {
  opciones: { valor: string; etiqueta: string }[];
  defaultValue?: string;
}

/** Desplegable. */
export function Select({
  etiqueta,
  nombre,
  error,
  ayuda,
  requerido,
  opciones,
  defaultValue,
}: SelectProps) {
  const id = useId();
  const idError = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow text-muted">
        {etiqueta}
        {!requerido && <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>}
      </label>
      <select
        id={id}
        name={nombre}
        required={requerido}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={CLASES_CONTROL}
      >
        {opciones.map(({ valor, etiqueta: texto }) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      {ayuda && !error && <p className="caption text-faint">{ayuda}</p>}
      {error && (
        <p id={idError} className="caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface InterruptorProps {
  etiqueta: string;
  nombre: string;
  detalle?: string;
  defaultChecked?: boolean;
}

/** Interruptor simple — «marca si va destacada en Inicio» (§07). */
export function Interruptor({ etiqueta, nombre, detalle, defaultChecked }: InterruptorProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        name={nombre}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-ink"
      />
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <span className="text-[0.9375rem] text-ink">{etiqueta}</span>
        {detalle && <span className="caption text-muted">{detalle}</span>}
      </label>
    </div>
  );
}
