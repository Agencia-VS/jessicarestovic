"use client";

import { useActionState } from "react";
import { Campo, Area } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { SubirImagen } from "./subir-imagen";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarSobreMi } from "@/lib/acciones/paginas";
import type { SobreMiContenido } from "@/lib/data/tipos";

/** Un formulario de una sola página: foto de perfil y texto de biografía (§07). */
export function FormularioSobreMi({ contenido }: { contenido: SobreMiContenido }) {
  const [resultado, accion, guardando] = useActionState(guardarSobreMi, INICIAL);
  const errores = resultado.errores ?? {};

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <SubirImagen
        nombre="retrato"
        etiqueta="Retrato"
        tipo="retrato"
        pathActual={contenido.retrato_path}
      />

      <Campo
        etiqueta="Descripción del retrato"
        nombre="retrato_alt"
        defaultValue={contenido.retrato_alt ?? ""}
        error={errores.retrato_alt}
        ayuda="Una frase corta de qué se ve en la foto."
      />

      <Campo
        etiqueta="Título de la página"
        nombre="titulo"
        requerido
        defaultValue={contenido.titulo}
        error={errores.titulo}
      />

      <Area
        etiqueta="Biografía"
        nombre="biografia"
        requerido
        rows={12}
        defaultValue={contenido.biografia}
        error={errores.biografia}
        ayuda="Deja una línea en blanco entre párrafos."
      />

      <Area
        etiqueta="Cita"
        nombre="cita"
        rows={3}
        defaultValue={contenido.cita ?? ""}
        error={errores.cita}
        ayuda="Se muestra destacada al final de la página."
      />

      <Boton type="submit" cargando={guardando} className="self-start">
        Guardar cambios
      </Boton>
    </form>
  );
}
