"use client";

import { useState } from "react";
import { FormularioContacto } from "./formulario-contacto";

/**
 * El formulario de Clases va debajo de la información, no al costado: en
 * pantalla grande quedaba flotando lejos de la lista de técnicas.
 *
 * Empieza cerrado detrás de un enlace y aparece con un fundido suave desde
 * abajo. Así la página se lee primero y el formulario llega cuando el visitante
 * ya decidió que le interesa.
 */
export function InteresClases() {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="eyebrow self-start border-b border-ink pb-1 tracking-[0.18em] transition-colors hover:border-accent hover:text-accent"
      >
        Me interesa un taller
      </button>
    );
  }

  return (
    <div className="aparece w-full max-w-[28.75rem]">
      <FormularioContacto
        origen="clases"
        textoBoton="Enviar"
        placeholderMensaje="Cuéntame qué técnica te interesa y tu disponibilidad."
      />
    </div>
  );
}
