"use client";

import { useActionState, useState } from "react";
import { Area, Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { SubirImagen } from "./subir-imagen";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarPortada } from "@/lib/acciones/paginas";
import type { ConfiguracionContenido } from "@/types/database";

export function FormularioPortada({
  contenido,
  portadaUrl,
}: {
  contenido: ConfiguracionContenido;
  portadaUrl: string | null;
}) {
  const [resultado, accion, guardando] = useActionState(guardarPortada, INICIAL);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const errores = resultado.errores ?? {};

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <SubirImagen
        nombre="portada"
        etiqueta="Foto de portada"
        tipo="destacada"
        urlActual={portadaUrl}
        alCambiarEstado={setSubiendoPortada}
      />

      <Campo
        etiqueta="Descripción de la foto"
        nombre="portada_alt"
        defaultValue={contenido.portada_alt ?? ""}
        error={errores.portada_alt}
        ayuda="Una frase corta sobre lo que aparece en la portada."
      />

      <Area
        etiqueta="Frase de portada"
        nombre="cita"
        requerido
        rows={3}
        defaultValue={contenido.cita}
        error={errores.cita}
        ayuda="La frase que aparece debajo de la imagen en el Inicio."
      />

      <Boton type="submit" cargando={guardando} disabled={subiendoPortada} className="self-start">
        Guardar portada
      </Boton>
    </form>
  );
}
