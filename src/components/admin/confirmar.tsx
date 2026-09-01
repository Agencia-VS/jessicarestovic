"use client";

import { useState } from "react";

interface ConfirmarProps {
  /** Lo que se va a borrar, para nombrarlo en la pregunta. */
  nombre: string;
  /** La acción de borrado, ya con el id enlazado. */
  accion: () => void;
  etiqueta?: string;
}

/**
 * Pide confirmación antes de borrar (§07). El botón se convierte en la
 * pregunta, sin abrir una ventana aparte — un paso menos en el celular.
 */
export function Confirmar({ nombre, accion, etiqueta = "Eliminar" }: ConfirmarProps) {
  const [preguntando, setPreguntando] = useState(false);

  if (!preguntando) {
    return (
      <button
        type="button"
        onClick={() => setPreguntando(true)}
        className="caption text-muted transition-colors hover:text-danger"
      >
        {etiqueta}
      </button>
    );
  }

  return (
    <span className="caption flex flex-wrap items-center gap-3">
      <span className="text-ink">¿Eliminar «{nombre}»?</span>
      <button
        type="button"
        onClick={() => {
          setPreguntando(false);
          accion();
        }}
        className="text-danger underline underline-offset-4"
      >
        Sí, eliminar
      </button>
      <button
        type="button"
        onClick={() => setPreguntando(false)}
        className="text-muted underline underline-offset-4"
      >
        Cancelar
      </button>
    </span>
  );
}
