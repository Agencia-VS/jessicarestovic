"use client";

import { useActionState, useTransition } from "react";
import { Campo, Area, Interruptor } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { SubirFotos } from "./subir-fotos";
import { Aviso } from "./aviso";
import { Confirmar } from "./confirmar";
import { INICIAL } from "@/lib/acciones/resultado";
import {
  crearExposicion,
  editarExposicion,
  eliminarFoto,
} from "@/lib/acciones/exposiciones";
import { urlImagen } from "@/lib/images";
import type { Exposicion } from "@/lib/data/tipos";

interface FormularioExposicionProps {
  /** Cuando viene una exposición, el formulario edita en vez de crear. */
  exposicion?: Exposicion;
}

/** El mismo formulario para crear y editar una exposición. */
export function FormularioExposicion({ exposicion }: FormularioExposicionProps) {
  const editando = Boolean(exposicion);
  const accionBase = exposicion
    ? editarExposicion.bind(null, exposicion.id)
    : crearExposicion;

  const [resultado, accion, guardando] = useActionState(accionBase, INICIAL);
  const [, iniciar] = useTransition();
  const errores = resultado.errores ?? {};

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <Campo
        etiqueta="Título"
        nombre="titulo"
        requerido
        defaultValue={exposicion?.titulo}
        error={errores.titulo}
      />

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Campo
          etiqueta="Lugar"
          nombre="lugar"
          defaultValue={exposicion?.lugar ?? ""}
          error={errores.lugar}
          placeholder="Fundación Guayasamín, Quito"
        />
        <Campo
          etiqueta="Año"
          nombre="anio"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          defaultValue={exposicion?.anio ?? ""}
          error={errores.anio}
        />
      </div>

      <Area
        etiqueta="Descripción"
        nombre="descripcion"
        rows={5}
        defaultValue={exposicion?.descripcion ?? ""}
        error={errores.descripcion}
        ayuda="Se muestra al desplegar la exposición en el listado."
      />

      {/* Fotos ya cargadas, con la opción de quitarlas. */}
      {exposicion && exposicion.fotos.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="eyebrow text-muted">Fotos cargadas</span>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {exposicion.fotos.map((foto) => (
              <li key={foto.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlImagen(foto.imagen_path)}
                  alt={foto.imagen_alt}
                  className="aspect-3/2 w-full object-cover"
                />
                <Confirmar
                  nombre="esta foto"
                  etiqueta="Quitar"
                  accion={() => iniciar(() => eliminarFoto(foto.id))}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <SubirFotos />

      <div className="border-t border-line pt-6">
        <Interruptor
          etiqueta="Publicada"
          nombre="publicada"
          detalle="Si la desmarcas, la exposición deja de verse en el sitio pero no se borra."
          defaultChecked={exposicion?.publicada ?? true}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando}>
          {editando ? "Guardar cambios" : "Publicar exposición"}
        </Boton>
        <BotonEnlace href="/admin/exposiciones">Volver</BotonEnlace>
      </div>
    </form>
  );
}
