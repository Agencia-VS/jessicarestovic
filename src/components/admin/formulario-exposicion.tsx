"use client";

import { useActionState, useState, useTransition } from "react";
import { Campo, Area, Interruptor } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { SubirFotos } from "./subir-fotos";
import { Aviso } from "./aviso";
import { Confirmar } from "./confirmar";
import { INICIAL } from "@/lib/acciones/resultado";
import { crearExposicion, editarExposicion, eliminarFoto } from "@/lib/acciones/exposiciones";
import type { Exposicion, TipoDeGrupo } from "@/lib/data/tipos";

interface FormularioExposicionProps {
  exposicion?: Exposicion;
  /**
   * Qué se está creando. Al editar manda el tipo del grupo, que no cambia:
   * una muestra no se convierte en conjunto ni al revés.
   */
  tipo?: TipoDeGrupo;
}

/**
 * El mismo formulario para crear y editar un grupo de obras, sea una muestra o
 * un conjunto de trabajo.
 *
 * Lo que cambia con el tipo es lo que solo tiene sentido con sala: el lugar y
 * las vistas de montaje. El resto —título, año, descripción y el interruptor
 * de publicada— es idéntico, así que es un formulario y no dos.
 *
 * Las obras del grupo no están acá sino debajo, en la página: son su propia
 * superficie, con su arrastre y su alta, y no tendría sentido meter una grilla
 * con botones dentro de un `<form>`.
 */
export function FormularioExposicion({
  exposicion,
  tipo: tipoInicial = "exposicion",
}: FormularioExposicionProps) {
  const editando = Boolean(exposicion);
  const tipo = exposicion?.tipo ?? tipoInicial;
  const esTrabajo = tipo === "trabajo";
  const seccion = esTrabajo ? "/admin/trabajos" : "/admin/exposiciones";
  const accionBase = exposicion
    ? editarExposicion.bind(null, exposicion.id, tipo)
    : crearExposicion.bind(null, tipo);
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
        {/* El lugar solo existe si hubo sala. */}
        {!esTrabajo && (
          <Campo
            etiqueta="Lugar"
            nombre="lugar"
            defaultValue={exposicion?.lugar ?? ""}
            error={errores.lugar}
            placeholder="Fundación Guayasamín, Quito"
          />
        )}
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
        ayuda={
          esTrabajo
            ? "Se muestra sobre las obras del conjunto."
            : "Se muestra al desplegar la exposición en el listado."
        }
      />

      {!esTrabajo && exposicion && exposicion.fotos.length > 0 && (
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

      {/* Las vistas de montaje solo tienen sentido en una muestra. */}
      {!esTrabajo && <SubirFotos alCambiarEstado={setSubiendoFotos} />}

      <div className="border-t border-line pt-6">
        <Interruptor
          etiqueta="Publicada"
          nombre="publicada"
          detalle={
            esTrabajo
              ? "Si lo desmarcas, el conjunto deja de verse en el sitio pero no se borra."
              : "Si la desmarcas, la exposición deja de verse en el sitio pero no se borra."
          }
          defaultChecked={exposicion?.publicada ?? true}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando} disabled={subiendoFotos}>
          {editando ? "Guardar cambios" : esTrabajo ? "Crear conjunto" : "Publicar exposición"}
        </Boton>
        <BotonEnlace href={seccion}>Volver</BotonEnlace>
      </div>
    </form>
  );
}
