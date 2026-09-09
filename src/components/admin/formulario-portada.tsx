"use client";

import { useActionState, useCallback, useState } from "react";
import { Area, Campo, Interruptor } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Aviso } from "./aviso";
import { SubirImagen } from "./subir-imagen";
import { INICIAL } from "@/lib/acciones/resultado";
import { guardarPortada } from "@/lib/acciones/paginas";
import { campoPortada, CELDAS_PORTADA } from "@/lib/site-config";
import type { ConfiguracionContenido } from "@/types/database";

interface FormularioPortadaProps {
  contenido: ConfiguracionContenido;
  /** Las URL ya resueltas de las fotos guardadas, en el orden del tríptico. */
  portadaUrls: (string | null)[];
}

/**
 * La portada del Inicio: tres fotos y la frase.
 *
 * Las celdas se llenan de izquierda a derecha y con una o dos también
 * funciona. Cada una tiene su casilla para quitarla, que es la única forma de
 * pasar de tres a dos: «cambiar la foto» reemplaza, no vacía.
 */
export function FormularioPortada({ contenido, portadaUrls }: FormularioPortadaProps) {
  const [resultado, accion, guardando] = useActionState(guardarPortada, INICIAL);
  const [ocupadas, setOcupadas] = useState<boolean[]>(() =>
    Array.from({ length: CELDAS_PORTADA }, () => false),
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

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-8">
      <Aviso resultado={resultado} />

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
