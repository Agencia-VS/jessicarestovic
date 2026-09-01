"use client";

import { cerrarSesion } from "@/lib/acciones/sesion";

export function BotonSalir() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="caption text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        Salir
      </button>
    </form>
  );
}
