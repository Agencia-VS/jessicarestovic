"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Campo, Area, Interruptor, Select } from "@/components/ui/campo";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { SubirImagen } from "./subir-imagen";
import { Aviso } from "./aviso";
import { INICIAL } from "@/lib/acciones/resultado";
import { crearGrupoRapido } from "@/lib/acciones/exposiciones";
import { crearObra, editarObra } from "@/lib/acciones/obras";
import type { Exposicion, Obra } from "@/lib/data/tipos";
import { seccionDeGrupo } from "@/lib/site-config";

interface FormularioObraProps {
  /** Todos los grupos, muestras y conjuntos de trabajo, para el desplegable. */
  exposiciones: Exposicion[];
  conjuntos: string[];
  exposicionInicial?: string;
  /** Cuando viene una obra, el formulario edita en vez de crear. */
  obra?: Obra;
}

/**
 * Formulario de obra. La obra pertenece a un grupo —una muestra o un conjunto
 * de trabajo— y, dentro de él, opcionalmente a un conjunto con nombre.
 *
 * El desplegable ofrece los dos tipos separados por encabezado, porque para
 * Jessica la pregunta es una sola: dónde va esta obra.
 */
export function FormularioObra({
  exposiciones,
  conjuntos,
  exposicionInicial,
  obra,
}: FormularioObraProps) {
  const editando = Boolean(obra);
  const router = useRouter();
  const accionBase = obra ? editarObra.bind(null, obra.id) : crearObra;
  const [resultado, accion, guardando] = useActionState(accionBase, INICIAL);
  const [listaExposiciones, setListaExposiciones] = useState(exposiciones);
  const [exposicionElegida, setExposicionElegida] = useState(
    obra?.exposicion_id ?? exposicionInicial ?? "",
  );
  const [conjunto, setConjunto] = useState(obra?.conjunto ?? "");
  const [creandoExposicion, setCreandoExposicion] = useState(false);
  const [tituloExposicion, setTituloExposicion] = useState("");
  const [problemaExposicion, setProblemaExposicion] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [, iniciar] = useTransition();

  const errores = resultado.errores ?? {};

  // Se vuelve al grupo del que se entró: ya no hay una sección de obras.
  const grupoElegido = listaExposiciones.find((grupo) => grupo.id === exposicionElegida);
  const volverA = grupoElegido
    ? `${seccionDeGrupo(grupoElegido.tipo)}/${grupoElegido.id}`
    : "/admin/trabajos";

  /** Las opciones de un tipo, rotuladas con su año y si está oculto. */
  const opcionesDe = (tipo: Exposicion["tipo"]) =>
    listaExposiciones
      .filter((grupo) => grupo.tipo === tipo)
      .map((grupo) => ({
        valor: grupo.id,
        etiqueta: `${grupo.titulo}${grupo.anio ? ` · ${grupo.anio}` : ""}${
          grupo.publicada ? "" : " (oculto)"
        }`,
      }));

  const cambiarExposicion = (valor: string) => {
    setExposicionElegida(valor);
    if (valor !== (obra?.exposicion_id ?? exposicionInicial ?? "")) setConjunto("");
  };

  const crearGrupo = () => {
    setProblemaExposicion(null);
    iniciar(async () => {
      const salida = await crearGrupoRapido(tituloExposicion);
      if ("error" in salida) {
        setProblemaExposicion(salida.error);
        return;
      }

      setListaExposiciones((previa) => [
        ...previa,
        {
          id: salida.id,
          titulo: salida.titulo,
          slug: salida.slug,
          tipo: "trabajo",
          lugar: null,
          anio: null,
          descripcion: null,
          publicada: false,
          orden: previa.length + 1,
          creado_en: "",
          actualizado_en: "",
          fotos: [],
          obrasPublicadas: 0,
          portada: null,
        },
      ]);
      setExposicionElegida(salida.id);
      setConjunto("");
      setTituloExposicion("");
      setCreandoExposicion(false);
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
        urlActual={obra?.imagenUrl ?? null}
        requerido={!editando}
        alCambiarEstado={setSubiendoImagen}
      />

      <div className="flex flex-col gap-4">
        <Select
          etiqueta="Exposición o conjunto"
          nombre="exposicion_id"
          value={exposicionElegida}
          onChange={(evento) => cambiarExposicion(evento.target.value)}
          opciones={[{ valor: "", etiqueta: "Sin asignar" }]}
          grupos={[
            { etiqueta: "Exposiciones", opciones: opcionesDe("exposicion") },
            { etiqueta: "Trabajos", opciones: opcionesDe("trabajo") },
          ]}
          ayuda="Una obra puede quedar sin asignar y se conserva en el panel, pero no se ve en el sitio."
        />

        {creandoExposicion ? (
          <div className="flex flex-col gap-2 border-l border-line pl-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={tituloExposicion}
                onChange={(evento) => setTituloExposicion(evento.target.value)}
                placeholder="Nombre del conjunto nuevo"
                autoFocus
                className="w-full border-b border-line bg-transparent py-2.5 text-[0.9375rem] placeholder:text-faint focus:border-ink focus:outline-none"
              />
              <Boton type="button" variante="secundario" onClick={crearGrupo}>
                Crear
              </Boton>
            </div>
            <p className="caption text-faint">
              Nace oculto. Complétalo después en Trabajos. Una exposición se
              registra en «Exposiciones», donde están su lugar y sus fotos de sala.
            </p>
            {problemaExposicion && (
              <p role="alert" className="caption text-danger">
                {problemaExposicion}
              </p>
            )}
            <button
              type="button"
              onClick={() => setCreandoExposicion(false)}
              className="caption self-start text-muted underline underline-offset-4"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreandoExposicion(true)}
            className="caption self-start text-ink underline underline-offset-4"
          >
            Crear un conjunto nuevo
          </button>
        )}

        <div className="flex flex-col gap-1.5">
          <Campo
            etiqueta="Conjunto"
            nombre="conjunto"
            value={conjunto}
            onChange={(evento) => setConjunto(evento.target.value)}
            list="conjuntos-existentes"
            ayuda="Opcional. Si coincide con un conjunto existente, se conserva su ortografía."
          />
          <datalist id="conjuntos-existentes">
            {conjuntos.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        </div>
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
          detalle="Se usa en el tríptico del Inicio mientras no haya fotos cargadas ahí."
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
        <Boton type="submit" cargando={guardando} disabled={subiendoImagen}>
          {editando ? "Guardar cambios" : "Publicar obra"}
        </Boton>
        <BotonEnlace href={volverA}>Volver</BotonEnlace>
      </div>
    </form>
  );
}
