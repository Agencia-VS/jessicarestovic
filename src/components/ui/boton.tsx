"use client";

import Link from "next/link";

const VARIANTES = {
  primario: "bg-ink text-paper hover:bg-body disabled:bg-faint",
  secundario: "border border-line text-ink hover:border-ink disabled:text-faint",
  peligro: "border border-danger text-danger hover:bg-danger-soft",
} as const;

const BASE =
  "eyebrow inline-flex items-center justify-center gap-2 px-6 py-3 transition-colors " +
  "disabled:cursor-not-allowed";

type Variante = keyof typeof VARIANTES;

type BotonProps = {
  variante?: Variante;
  cargando?: boolean;
} & React.ComponentPropsWithoutRef<"button">;

export function Boton({
  variante = "primario",
  cargando = false,
  disabled,
  children,
  className = "",
  ...resto
}: BotonProps) {
  return (
    <button
      {...resto}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
    >
      {cargando ? "Guardando…" : children}
    </button>
  );
}

type BotonEnlaceProps = {
  variante?: Variante;
  href: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className">;

/** El mismo botón, cuando lo que hace es navegar. */
export function BotonEnlace({
  variante = "secundario",
  href,
  children,
  ...resto
}: BotonEnlaceProps) {
  return (
    <Link {...resto} href={href} className={`${BASE} ${VARIANTES[variante]}`}>
      {children}
    </Link>
  );
}
