import type { Exposicion, FotoLista, Obra } from "@/lib/data/tipos";

/**
 * Una foto tal como la muestra la vista ampliada, ya sin importar de dónde
 * viene: una obra, una vista de sala o una de las del Inicio.
 *
 * El visor es uno solo a propósito —mismas flechas, mismo Escape, mismo
 * contador— y lo único que cambia por tipo de foto es qué se lee abajo. Estos
 * `piezasDe…` son esa traducción.
 *
 * Viven en un módulo aparte del visor, y sin `"use client"`, porque las
 * galerías se arman en el servidor: una función exportada desde un módulo de
 * cliente no se puede llamar desde ahí.
 */
export interface PiezaAmpliada {
  id: string;
  imagenUrl: string;
  alt: string;
  ancho: number | null;
  alto: number | null;
  /** Lo que se lee grande abajo a la izquierda, si hay. */
  titulo: string | null;
  /** La línea chica bajo el título, si hay. */
  subtitulo: string | null;
  /** Los datos de ficha de la derecha; vacío es válido y no dibuja nada. */
  ficha: { clave: string; valor: string }[];
}

/** Las obras de una retícula, con su ficha completa. */
export function piezasDeObras(obras: Obra[]): PiezaAmpliada[] {
  return obras.map((obra) => ({
    id: obra.id,
    imagenUrl: obra.imagenUrl,
    alt: obra.imagen_alt,
    ancho: obra.imagen_ancho,
    alto: obra.imagen_alto,
    titulo: obra.titulo,
    subtitulo: obra.exposicion?.titulo ?? null,
    ficha: [
      { clave: "Año", valor: obra.anio ? String(obra.anio) : "—" },
      { clave: "Técnica", valor: obra.tecnica ?? "—" },
      { clave: "Dimensiones", valor: obra.dimensiones ?? "—" },
    ],
  }));
}

/**
 * Las vistas de montaje de una muestra. Acá no hay ficha de obra —una sala no
 * tiene técnica ni medidas—, así que el pie es la muestra y su lugar.
 */
export function piezasDeVistas(exposicion: Exposicion): PiezaAmpliada[] {
  const lugar = [exposicion.lugar, exposicion.anio].filter(Boolean).join(" · ");

  return exposicion.fotos.map((foto, indice) => ({
    id: foto.id,
    imagenUrl: foto.imagenUrl,
    alt: foto.imagen_alt,
    ancho: foto.imagen_ancho,
    alto: foto.imagen_alto,
    titulo: `Vista ${indice + 1} de ${exposicion.fotos.length}`,
    subtitulo: [exposicion.titulo, lugar].filter(Boolean).join(" · ") || null,
    ficha: [],
  }));
}

/**
 * Fotos sueltas, como las del tríptico del Inicio: el visor muestra solo la
 * foto y el contador, porque no hay título ni ficha que mostrar.
 */
export function piezasDeFotos(fotos: FotoLista[]): PiezaAmpliada[] {
  return fotos.map((foto) => ({
    id: foto.src,
    imagenUrl: foto.src,
    alt: foto.alt,
    ancho: foto.ancho,
    alto: foto.alto,
    titulo: null,
    subtitulo: null,
    ficha: [],
  }));
}
