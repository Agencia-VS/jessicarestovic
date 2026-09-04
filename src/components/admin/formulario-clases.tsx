"use client";

import { useActionState } from "react";
import { Campo, Area } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarClases } from "@/lib/acciones/paginas";
import type { ClasesContenido } from "@/lib/data/tipos";

/** Edición del texto y las técnicas que se ofrecen en los talleres (§07). */
export function FormularioClases({ contenido }: { contenido: ClasesContenido }) {
  const [resultado, accion, guardando] = useActionState(guardarClases, INICIAL);
  const errores = resultado.errores ?? {};

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <Campo
        etiqueta="Título de la página"
        nombre="titulo"
        requerido
        defaultValue={contenido.titulo}
        error={errores.titulo}
      />

      <Area
        etiqueta="Presentación"
        nombre="introduccion"
        requerido
        rows={6}
        defaultValue={contenido.introduccion}
        error={errores.introduccion}
      />

      <Area
        etiqueta="Técnicas"
        nombre="tecnicas"
        rows={5}
        defaultValue={contenido.tecnicas.join("\n")}
        error={errores.tecnicas}
        ayuda="Una técnica por línea. Para agregarle una descripción corta, escribe «Acuarela — Papel, aguadas, transparencia»."
      />

      <Campo
        etiqueta="Nota"
        nombre="nota"
        defaultValue={contenido.nota ?? ""}
        error={errores.nota}
        ayuda="Por ejemplo, el máximo de personas por taller."
      />

      <Boton type="submit" cargando={guardando} className="self-start">
        Guardar cambios
      </Boton>
    </form>
  );
}
