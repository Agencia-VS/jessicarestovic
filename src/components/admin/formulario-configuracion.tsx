"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarConfiguracion } from "@/lib/acciones/paginas";
import type { ConfiguracionContenido } from "@/types/database";

/**
 * Datos de contacto del sitio.
 *
 * Un campo por cosa: el enlace de WhatsApp se arma solo con los dígitos del
 * teléfono y el de Instagram con el usuario, así Jessica nunca escribe una URL.
 */
export function FormularioConfiguracion({ contenido }: { contenido: ConfiguracionContenido }) {
  const [resultado, accion, guardando] = useActionState(guardarConfiguracion, INICIAL);
  const errores = resultado.errores ?? {};

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <Campo
        etiqueta="Correo"
        nombre="email"
        type="email"
        requerido
        defaultValue={contenido.email}
        error={errores.email}
        ayuda="Aparece en Contacto y en el pie de todas las páginas."
      />

      <Campo
        etiqueta="Teléfono / WhatsApp"
        nombre="telefono"
        type="tel"
        requerido
        defaultValue={contenido.telefono}
        error={errores.telefono}
        ayuda="Con el código de país, por ejemplo +56 9 8747 2258. El botón de WhatsApp se arma solo."
      />

      <Campo
        etiqueta="Instagram"
        nombre="instagram"
        requerido
        defaultValue={contenido.instagram}
        error={errores.instagram}
        ayuda="Solo tu usuario, por ejemplo @jessica_restovic."
      />

      <Boton type="submit" cargando={guardando} className="self-start">
        Guardar cambios
      </Boton>
    </form>
  );
}
