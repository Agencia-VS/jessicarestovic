"use client";

import { useActionState, useState } from "react";
import { Campo, Area } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { SubirImagen } from "./subir-imagen";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarSobreMi } from "@/lib/acciones/paginas";
import type { SobreMiContenido } from "@/lib/data/tipos";

/** Un formulario de una sola página: foto de perfil y texto de biografía (§07). */
interface FormularioSobreMiProps {
  contenido: SobreMiContenido;
  /** URL del retrato guardado, ya resuelta en el servidor. */
  retratoUrl: string | null;
}

export function FormularioSobreMi({ contenido, retratoUrl }: FormularioSobreMiProps) {
  const [resultado, accion, guardando] = useActionState(guardarSobreMi, INICIAL);
  const [subiendoRetrato, setSubiendoRetrato] = useState(false);
  const [errorRetrato, setErrorRetrato] = useState<string | null>(null);
  const errores = resultado.errores ?? {};

  const validarAntesDeGuardar = (evento: React.FormEvent<HTMLFormElement>) => {
    const datos = new FormData(evento.currentTarget);
    const seleccionada = datos.get("retrato_seleccionada") === "1";
    const ruta = String(datos.get("retrato_path") ?? "").trim();

    if (seleccionada && !ruta) {
      evento.preventDefault();
      setErrorRetrato("La foto todavía no terminó de subir. Espera a que finalice y vuelve a intentar.");
      return;
    }

    setErrorRetrato(null);
  };

  return (
    <form action={accion} onSubmit={validarAntesDeGuardar} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <SubirImagen
        nombre="retrato"
        etiqueta="Retrato"
        tipo="retrato"
        urlActual={retratoUrl}
        alCambiarEstado={setSubiendoRetrato}
      />
      {errorRetrato && (
        <p role="alert" className="caption text-danger">
          {errorRetrato}
        </p>
      )}

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

      <Boton type="submit" cargando={guardando} disabled={subiendoRetrato} className="self-start">
        Guardar cambios
      </Boton>
    </form>
  );
}
