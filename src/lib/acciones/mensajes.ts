"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { erroresPorCampo, mensajeSchema } from "@/lib/validacion";

export interface ResultadoFormulario {
  estado: "inicial" | "ok" | "error";
  /** Mensaje para mostrar arriba del formulario. */
  aviso?: string;
  /** Errores por campo. */
  errores?: Record<string, string>;
  /** Valores enviados, para no perderlos si algo falló. */
  valores?: Record<string, string>;
}

export const RESULTADO_INICIAL: ResultadoFormulario = { estado: "inicial" };

/**
 * Recibe un envío de Contacto o Clases y lo guarda como mensaje.
 *
 * Los dos formularios comparten esta acción y se distinguen por el campo
 * `origen`, que es lo que después separa la bandeja del panel (§12: hoy están
 * separados en Wix; acá quedan unificados en una bandeja, etiquetados).
 */
export async function enviarMensaje(
  _previo: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    mensaje: String(formData.get("mensaje") ?? ""),
    origen: String(formData.get("origen") ?? "contacto"),
  };

  const analisis = mensajeSchema.safeParse(valores);
  if (!analisis.success) {
    return {
      estado: "error",
      errores: erroresPorCampo(analisis.error),
      valores,
    };
  }

  if (!supabaseConfigurado()) {
    return {
      estado: "error",
      aviso:
        "El formulario todavía no está conectado. Escríbeme por WhatsApp o correo mientras lo terminamos de configurar.",
      valores,
    };
  }

  const { nombre, email, telefono, mensaje, origen } = analisis.data;

  const supabase = await createClient();
  const { error } = await supabase.from("mensaje").insert({
    nombre,
    email,
    telefono: telefono ? telefono : null,
    mensaje,
    origen,
  });

  if (error) {
    return {
      estado: "error",
      aviso:
        "No pudimos enviar el mensaje. Vuelve a intentar en un momento, o escríbeme por WhatsApp.",
      valores,
    };
  }

  revalidatePath("/admin/mensajes");

  return {
    estado: "ok",
    aviso:
      origen === "clases"
        ? "¡Gracias! Recibí tu interés en los talleres y te escribo pronto."
        : "¡Gracias! Recibí tu mensaje y te respondo pronto.",
  };
}
