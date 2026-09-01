"use client";

import { useActionState } from "react";
import { Campo, Area } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { enviarMensaje, RESULTADO_INICIAL } from "@/lib/acciones/mensajes";
import type { MensajeOrigen } from "@/types/database";

interface FormularioContactoProps {
  origen: MensajeOrigen;
  /** Texto del botón: cambia entre «Enviar mensaje» y «Quiero información». */
  textoBoton?: string;
  placeholderMensaje?: string;
}

/**
 * El formulario de Contacto y el de Clases son el mismo, cambia el `origen`.
 * Así la bandeja del panel puede mostrar de dónde viene cada envío sin
 * duplicar código ni tablas.
 */
export function FormularioContacto({
  origen,
  textoBoton = "Enviar mensaje",
  placeholderMensaje,
}: FormularioContactoProps) {
  const [resultado, accion, enviando] = useActionState(enviarMensaje, RESULTADO_INICIAL);

  if (resultado.estado === "ok") {
    return (
      <div
        role="status"
        className="border-l-2 border-success bg-success-soft px-6 py-5 text-[0.9375rem] text-ink"
      >
        {resultado.aviso}
      </div>
    );
  }

  const { errores = {}, valores = {} } = resultado;

  return (
    <form action={accion} className="flex max-w-lg flex-col gap-7">
      <input type="hidden" name="origen" value={origen} />

      {resultado.aviso && (
        <p role="alert" className="border-l-2 border-danger bg-danger-soft px-5 py-4 text-sm text-ink">
          {resultado.aviso}
        </p>
      )}

      <Campo
        etiqueta="Nombre"
        nombre="nombre"
        requerido
        autoComplete="name"
        defaultValue={valores.nombre}
        error={errores.nombre}
      />
      <Campo
        etiqueta="Correo"
        nombre="email"
        type="email"
        requerido
        autoComplete="email"
        defaultValue={valores.email}
        error={errores.email}
      />
      <Campo
        etiqueta="Teléfono"
        nombre="telefono"
        type="tel"
        autoComplete="tel"
        defaultValue={valores.telefono}
        error={errores.telefono}
      />
      <Area
        etiqueta="Mensaje"
        nombre="mensaje"
        requerido
        placeholder={placeholderMensaje}
        defaultValue={valores.mensaje}
        error={errores.mensaje}
      />

      <Boton type="submit" cargando={enviando} className="self-start">
        {textoBoton}
      </Boton>
    </form>
  );
}
