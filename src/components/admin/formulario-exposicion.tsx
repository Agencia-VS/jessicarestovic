"use client";

import { useActionState, useState, useTransition } from "react";
import { Campo, Area, Interruptor } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { EncuadreTarjeta } from "./encuadre-tarjeta";
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
 * En Trabajos, las obras del conjunto se administran debajo del formulario.
 * En Exposiciones, las únicas imágenes que se cargan son las fotos de sala.
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

      {exposicion?.portada && (
        typeof exposicion.portada_foco_x === "number" && typeof exposicion.portada_foco_y === "number"
          ? <EncuadreTarjeta exposicion={exposicion} />
          : <p className="caption text-muted">El encuadre requiere aplicar la actualización 0007 de la base de datos. Puedes guardar los demás datos del grupo.</p>
      )}

      <Area
        etiqueta="Descripción"
        nombre="descripcion"
        rows={5}
        defaultValue={exposicion?.descripcion ?? ""}
        error={errores.descripcion}
        ayuda={
          esTrabajo
            ? "Se muestra sobre las obras del conjunto."
            : "Se muestra junto a las fotos de sala en la página de la exposición."
        }
      />

      {!esTrabajo && exposicion && exposicion.fotos.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-muted">Fotos de sala</span>
            <p className="caption text-faint">Edita aquí el título y las dimensiones de cada foto. Se muestran al abrirla en la galería.</p>
          </div>
          <ul className="flex flex-col gap-6">
            {exposicion.fotos.map((foto) => (
              <li key={foto.id} className="grid grid-cols-1 gap-3 border-b border-line pb-5 sm:grid-cols-[10rem_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.imagenUrl} alt={foto.imagen_alt} className="aspect-3/2 w-full object-cover" />
                <div className="flex min-w-0 flex-col gap-3">
                  <Campo
                    etiqueta="Título de la foto de sala"
                    nombre={`foto_existente_titulo_${foto.id}`}
                    defaultValue={foto.titulo ?? ""}
                    placeholder="Ej.: Sala principal"
                  />
                  <Campo
                    etiqueta="Dimensiones de la obra (opcional)"
                    nombre={`foto_existente_dimensiones_${foto.id}`}
                    defaultValue={foto.dimensiones ?? ""}
                    placeholder="Ej.: 60 × 80 cm"
                  />
                  <Confirmar
                    nombre="esta foto"
                    etiqueta="Quitar foto"
                    accion={() => iniciar(() => eliminarFoto(foto.id))}
                  />
                </div>
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
