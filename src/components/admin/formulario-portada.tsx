"use client";

import { useActionState, useCallback, useState } from "react";
import { Area, Campo, Interruptor } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { Encuadre } from "./encuadre";
import { SubirImagen } from "./subir-imagen";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarPortada } from "@/lib/acciones/paginas";
import { CAMPO_GRANDE, campoPortada, CELDAS_PORTADA, FOCO_POR_DEFECTO } from "@/lib/site-config";
import type { ConfiguracionContenido, FormatoPortada } from "@/types/database";

interface FormularioPortadaProps {
  contenido: ConfiguracionContenido;
  /** Las URL ya resueltas de las fotos guardadas, en el orden del tríptico. */
  portadaUrls: (string | null)[];
  /** La URL de la foto grande guardada, si hay una. */
  grandeUrl: string | null;
}

const FORMATOS: { valor: FormatoPortada; etiqueta: string; detalle: string }[] = [
  {
    valor: "triptico",
    etiqueta: "Tres fotos",
    detalle: "Un tríptico: tres cuadrados iguales, apenas separados.",
  },
  {
    valor: "grande",
    etiqueta: "Una foto grande",
    detalle: "Ocupa el lugar de las tres, y eliges qué parte se ve.",
  },
];

/** Un dibujo mínimo de cada formato: tres cuadrados, o uno ancho. */
function Dibujo({ formato }: { formato: FormatoPortada }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {formato === "triptico" ? (
        <>
          <span className="size-5 bg-faint" />
          <span className="size-5 bg-faint" />
          <span className="size-5 bg-faint" />
        </>
      ) : (
        <span className="h-5 w-16 bg-faint" />
      )}
    </span>
  );
}

/**
 * La portada del Inicio: el tríptico o una foto grande, y la frase.
 *
 * Jessica elige arriba cómo se ve, y abajo aparece lo que corresponde. Lo otro
 * no se borra, solo se esconde: queda guardado para volver a él sin subir las
 * fotos de nuevo, y una subida en curso sigue aunque cambie de opción.
 *
 * Las celdas del tríptico se llenan de izquierda a derecha y con una o dos
 * también funciona. Cada una tiene su casilla para quitarla, que es la única
 * forma de pasar de tres a dos: «cambiar la foto» reemplaza, no vacía.
 */
export function FormularioPortada({ contenido, portadaUrls, grandeUrl }: FormularioPortadaProps) {
  const [resultado, accion, guardando] = useActionState(guardarPortada, INICIAL);
  const [formato, setFormato] = useState<FormatoPortada>(contenido.portada_formato);
  const [foco, setFoco] = useState(contenido.portada_grande?.foco ?? FOCO_POR_DEFECTO);
  /** La foto grande recién elegida, para encuadrarla antes de guardar. */
  const [vistaGrande, setVistaGrande] = useState<string | null>(null);
  // Una celda por foto del tríptico, y la última para la foto grande.
  const [ocupadas, setOcupadas] = useState<boolean[]>(() =>
    Array.from({ length: CELDAS_PORTADA + 1 }, () => false),
  );
  const errores = resultado.errores ?? {};

  // El guardado espera a que terminen todas las subidas en curso. La guarda de
  // igualdad evita un re-render por cada aviso repetido de las celdas.
  const marcarOcupada = useCallback((indice: number, ocupado: boolean) => {
    setOcupadas((previas) => {
      if (previas[indice] === ocupado) return previas;
      const copia = [...previas];
      copia[indice] = ocupado;
      return copia;
    });
  }, []);

  // Una foto nueva empieza mostrando su parte de arriba: el encuadre de la
  // anterior no tiene por qué servirle.
  const alCambiarVista = useCallback((url: string | null) => {
    setVistaGrande(url);
    if (url) setFoco(FOCO_POR_DEFECTO);
  }, []);

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

      <fieldset className="flex flex-col gap-3">
        <legend className="eyebrow mb-3 text-muted">Cómo se ve el Inicio</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATOS.map(({ valor, etiqueta, detalle }) => (
            <label
              key={valor}
              className="flex cursor-pointer gap-3 border border-line p-4 transition-colors hover:border-faint has-checked:border-ink"
            >
              <input
                type="radio"
                name="formato"
                value={valor}
                checked={formato === valor}
                onChange={() => setFormato(valor)}
                className="mt-0.5 size-4 shrink-0 accent-ink"
              />
              <span className="flex flex-col gap-2.5">
                <Dibujo formato={valor} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[0.9375rem] text-ink">{etiqueta}</span>
                  <span className="caption text-muted">{detalle}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div hidden={formato !== "triptico"} className="flex flex-col gap-8">
        <p className="caption text-muted">
          El Inicio muestra estas tres fotos como un tríptico: tres cuadrados
          iguales, apenas separados. Se recortan al cuadrado para que la fila
          quede pareja, y al tocarlas se abren completas.
        </p>

        {Array.from({ length: CELDAS_PORTADA }, (_, indice) => {
          const campo = campoPortada(indice);
          const imagen = contenido.portadas[indice] ?? null;

          return (
            <div key={campo} className="flex flex-col gap-4 border-t border-line pt-6">
              <SubirImagen
                nombre={campo}
                etiqueta={`Foto ${indice + 1} de ${CELDAS_PORTADA}`}
                tipo="destacada"
                urlActual={portadaUrls[indice] ?? null}
                alCambiarEstado={(ocupado) => marcarOcupada(indice, ocupado)}
              />

              <Campo
                etiqueta="Descripción de la foto"
                nombre={`${campo}_alt`}
                defaultValue={imagen?.alt ?? ""}
                error={errores[`alts.${indice}`]}
                ayuda="Una frase corta sobre lo que aparece. Ayuda a quien no puede verla."
              />

              {imagen && (
                <Interruptor
                  etiqueta="Quitar esta foto"
                  nombre={`${campo}_quitar`}
                  detalle="Al guardar, la celda queda vacía y las siguientes corren un lugar."
                />
              )}
            </div>
          );
        })}
      </div>

      <div hidden={formato !== "grande"} className="flex flex-col gap-6">
        <p className="caption text-muted">
          Una sola foto ocupa el lugar de las tres. En el computador se ve como
          una franja ancha, así que de la foto se ve una parte: la eliges abajo.
          Al tocarla, se abre completa.
        </p>

        <SubirImagen
          nombre={CAMPO_GRANDE}
          etiqueta="La foto grande"
          tipo="portadaGrande"
          // Solo cuando es la opción elegida: escondida, un campo obligatorio
          // impediría guardar el tríptico.
          requerido={formato === "grande"}
          urlActual={grandeUrl}
          alCambiarEstado={(ocupado) => marcarOcupada(CELDAS_PORTADA, ocupado)}
          alCambiarVista={alCambiarVista}
        />

        <Encuadre
          url={vistaGrande ?? grandeUrl}
          nombre={`${CAMPO_GRANDE}_foco`}
          foco={foco}
          alCambiar={setFoco}
        />

        <Campo
          etiqueta="Descripción de la foto"
          nombre={`${CAMPO_GRANDE}_alt`}
          defaultValue={contenido.portada_grande?.alt ?? ""}
          error={errores.grande_alt}
          ayuda="Una frase corta sobre lo que aparece. Ayuda a quien no puede verla."
        />
      </div>

      <Area
        etiqueta="Frase de portada"
        nombre="cita"
        requerido
        rows={3}
        defaultValue={contenido.cita}
        error={errores.cita}
        ayuda="La frase que aparece debajo de las fotos en el Inicio."
      />

      <Boton
        type="submit"
        cargando={guardando}
        disabled={ocupadas.some(Boolean)}
        className="self-start"
      >
        Guardar portada
      </Boton>
    </form>
  );
}
