"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Area, Interruptor } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { SubirImagen } from "./subir-imagen";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { crearObra, crearSerieRapida, editarObra } from "@/lib/acciones/obras";
import type { Obra, Serie } from "@/lib/data/tipos";

interface FormularioObraProps {
  series: Serie[];
  /** Cuando viene una obra, el formulario edita en vez de crear. */
  obra?: Obra;
}

/**
 * Formulario de obra. Es el mismo para crear y editar: cambia la acción y el
 * texto del botón.
 *
 * Sigue el flujo del brief (§07): foto, serie, título, y los campos de ficha
 * como opcionales, que se pueden dejar en blanco y completar después.
 */
export function FormularioObra({ series, obra }: FormularioObraProps) {
  const editando = Boolean(obra);
  const router = useRouter();

  const accionBase = obra ? editarObra.bind(null, obra.id) : crearObra;
  const [resultado, accion, guardando] = useActionState(accionBase, INICIAL);

  const [listaSeries, setListaSeries] = useState(series);
  const [serieElegida, setSerieElegida] = useState(obra?.serie_id ?? "");
  const [creandoSerie, setCreandoSerie] = useState(false);
  const [nombreSerie, setNombreSerie] = useState("");
  const [problemaSerie, setProblemaSerie] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  const errores = resultado.errores ?? {};

  const crearSerie = () => {
    setProblemaSerie(null);
    iniciar(async () => {
      const salida = await crearSerieRapida(nombreSerie);
      if ("error" in salida) {
        setProblemaSerie(salida.error);
        return;
      }
      // La agregamos a la lista y la dejamos seleccionada, sin salir del form.
      setListaSeries((previa) => [
        ...previa,
        {
          id: salida.id,
          nombre: nombreSerie.trim(),
          slug: "",
          descripcion: null,
          orden: previa.length,
          creado_en: "",
          actualizado_en: "",
          obrasPublicadas: 0,
        },
      ]);
      setSerieElegida(salida.id);
      setNombreSerie("");
      setCreandoSerie(false);
      router.refresh();
    });
  };

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <SubirImagen
        nombre="imagen"
        etiqueta="Foto de la obra"
        tipo="obra"
        pathActual={obra?.imagen_path ?? null}
        requerido={!editando}
      />

      {/* --- Serie: elegir una existente o crear una nueva sin salir de acá --- */}
      <div className="flex flex-col gap-2">
        <label htmlFor="serie" className="eyebrow text-muted">
          Serie
          <span className="ml-2 normal-case tracking-normal text-faint">opcional</span>
        </label>

        {creandoSerie ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <input
                type="text"
                value={nombreSerie}
                onChange={(e) => setNombreSerie(e.target.value)}
                placeholder="Nombre de la serie nueva"
                autoFocus
                className="w-full border-b border-line bg-transparent py-2.5 text-[0.9375rem] placeholder:text-faint focus:border-ink focus:outline-none"
              />
              <Boton type="button" variante="secundario" onClick={crearSerie}>
                Crear
              </Boton>
            </div>
            {problemaSerie && (
              <p role="alert" className="caption text-danger">
                {problemaSerie}
              </p>
            )}
            <button
              type="button"
              onClick={() => setCreandoSerie(false)}
              className="caption self-start text-muted underline underline-offset-4"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <select
              id="serie"
              name="serie_id"
              value={serieElegida}
              onChange={(e) => setSerieElegida(e.target.value)}
              className="w-full border-b border-line bg-transparent py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none"
            >
              <option value="">Sin serie</option>
              {listaSeries.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {serie.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreandoSerie(true)}
              className="caption self-start text-ink underline underline-offset-4"
            >
              Crear serie nueva
            </button>
          </div>
        )}
      </div>

      <Campo
        etiqueta="Título"
        nombre="titulo"
        requerido
        defaultValue={obra?.titulo}
        error={errores.titulo}
      />

      <Area
        etiqueta="Descripción de la foto"
        nombre="imagen_alt"
        requerido
        rows={2}
        defaultValue={obra?.imagen_alt}
        error={errores.imagen_alt}
        ayuda="Una frase corta de qué se ve. La leen los buscadores y quien usa lector de pantalla."
      />

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
        <Campo
          etiqueta="Año"
          nombre="anio"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          defaultValue={obra?.anio ?? ""}
          error={errores.anio}
        />
        <Campo
          etiqueta="Técnica"
          nombre="tecnica"
          defaultValue={obra?.tecnica ?? ""}
          error={errores.tecnica}
          placeholder="Grafito sobre tela"
        />
        <Campo
          etiqueta="Medidas"
          nombre="dimensiones"
          defaultValue={obra?.dimensiones ?? ""}
          error={errores.dimensiones}
          placeholder="160 × 160 cm"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-6">
        <Interruptor
          etiqueta="Destacada en Inicio"
          nombre="destacada"
          detalle="Las obras destacadas son las que se ven en la portada."
          defaultChecked={obra?.destacada ?? false}
        />
        <Interruptor
          etiqueta="Publicada"
          nombre="publicada"
          detalle="Si la desmarcas, la obra deja de verse en el sitio pero no se borra."
          defaultChecked={obra?.publicada ?? true}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" cargando={guardando}>
          {editando ? "Guardar cambios" : "Publicar obra"}
        </Boton>
        <BotonEnlace href="/admin/obras">Volver</BotonEnlace>
      </div>
    </form>
  );
}
