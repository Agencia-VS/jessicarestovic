"use client";

import { useActionState } from "react";
import { CampoLinea } from "./campo-linea";
import { enviarMensaje } from "@/lib/acciones/mensajes";
import { INICIAL } from "@/lib/acciones/resultado";
import type { MensajeOrigen } from "@/types/database";

interface FormularioContactoProps {
  origen: MensajeOrigen;
  textoBoton?: string;
  placeholderMensaje?: string;
}

/**
 * El formulario de Contacto y el de Clases son el mismo, cambia el `origen`.
 * Así la bandeja del panel muestra de dónde viene cada envío sin duplicar
 * código ni tablas.
 */
export function FormularioContacto({
  origen,
  textoBoton = "Enviar",
  placeholderMensaje,
}: FormularioContactoProps) {
  const [resultado, accion, enviando] = useActionState(enviarMensaje, INICIAL);

  // La respuesta reemplaza al formulario: una línea en cursiva y el acento,
  // como el resto de los remates del sitio.
  if (resultado.estado === "ok") {
    return (
      <p role="status" className="font-display text-xl font-light italic text-accent">
        {resultado.aviso}
      </p>
    );
  }

  const { errores = {}, valores = {} } = resultado;

  return (
    <form action={accion} className="flex flex-col gap-[clamp(0.875rem,1.8vw,1.375rem)]">
      <input type="hidden" name="origen" value={origen} />

      {resultado.aviso && (
        <p role="alert" className="ficha border-l-2 border-danger bg-danger-soft px-4 py-3 text-ink">
          {resultado.aviso}
        </p>
      )}

      <CampoLinea
        etiqueta="Nombre"
        nombre="nombre"
        requerido
        autoComplete="name"
        defaultValue={valores.nombre}
        error={errores.nombre}
      />
      <CampoLinea
        etiqueta="Teléfono"
        nombre="telefono"
        type="tel"
        autoComplete="tel"
        defaultValue={valores.telefono}
        error={errores.telefono}
      />
      <CampoLinea
        etiqueta="Email"
        nombre="email"
        type="email"
        requerido
        autoComplete="email"
        defaultValue={valores.email}
        error={errores.email}
      />
      <CampoLinea
        etiqueta={placeholderMensaje ?? "Mensaje"}
        nombre="mensaje"
        requerido
        area
        defaultValue={valores.mensaje}
        error={errores.mensaje}
      />

      <button
        type="submit"
        disabled={enviando}
        aria-busy={enviando || undefined}
        className="eyebrow mt-1.5 self-start border-b border-ink pb-1 tracking-[0.18em] transition-colors hover:border-accent hover:text-accent disabled:border-faint disabled:text-faint"
      >
        {enviando ? "Enviando…" : textoBoton}
      </button>
    </form>
  );
}
