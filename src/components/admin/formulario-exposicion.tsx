"use client";

import { useActionState, useState, useTransition } from "react";
import { Campo, Area, Interruptor } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { SubirFotos } from "./subir-fotos";
import { Aviso } from "./aviso";
import { Confirmar } from "./confirmar";
import { INICIAL } from "@/lib/acciones/resultado";
import { crearExposicion, editarExposicion, eliminarFoto } from "@/lib/acciones/exposiciones";
import type { Exposicion, Obra } from "@/lib/data/tipos";

interface FormularioExposicionProps {
  exposicion?: Exposicion;
  /** Obras que ya pertenecen a la muestra, para el bloque de solo lectura. */
  obras?: Obra[];
}

/** El mismo formulario para crear y editar una exposición. */
export function FormularioExposicion({ exposicion, obras = [] }: FormularioExposicionProps) {
  const editando = Boolean(exposicion);
  const accionBase = exposicion ? editarExposicion.bind(null, exposicion.id) : crearExposicion;
  const [resultado, accion, guardando] = useActionState(accionBase, INICIAL);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
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

      {exposicion && (
        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow text-muted">
              Obras de esta muestra
              <span className="ml-2 normal-case tracking-normal text-faint">
                {obras.length}
              </span>
            </span>
            <BotonEnlace
              href={`/admin/trabajos-recientes/nueva?exposicion=${exposicion.id}`}
              variante="secundario"
            >
              Subir una obra a esta muestra
            </BotonEnlace>
          </div>
          {obras.length > 0 ? (
            <ul className="border-t border-line-soft">
              {obras.map((obra) => (
                <li
                  key={obra.id}
                  className="flex items-baseline justify-between gap-4 border-b border-line-soft py-3"
                >
                  <span className="text-sm text-ink">{obra.titulo}</span>
                  <span className="caption text-muted">
                    {obra.conjunto ?? "Sin conjunto"}
                    {!obra.publicada && " · Oculta"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="caption text-faint">Todavía no hay obras asignadas a esta muestra.</p>
          )}
        </div>
      )}

      {exposicion && exposicion.fotos.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="eyebrow text-muted">Fotos cargadas</span>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {exposicion.fotos.map((foto) => (
              <li key={foto.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.imagenUrl} alt={foto.imagen_alt} className="aspect-3/2 w-full object-cover" />
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

      <SubirFotos alCambiarEstado={setSubiendoFotos} />

      <div className="border-t border-line pt-6">
        <Interruptor
          etiqueta="Publicada"
          nombre="publicada"
          detalle="Si la desmarcas, la exposición deja de verse en el sitio pero no se borra."
          defaultChecked={exposicion?.publicada ?? true}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando} disabled={subiendoFotos}>
          {editando ? "Guardar cambios" : "Publicar exposición"}
        </Boton>
        <BotonEnlace href="/admin/exposiciones">Volver</BotonEnlace>
      </div>
    </form>
  );
}
