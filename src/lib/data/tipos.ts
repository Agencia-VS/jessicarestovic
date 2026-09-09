import type {
  ClasesContenido,
  ExposicionFotoRow,
  ExposicionRow,
  MensajeRow,
  ObraRow,
  SobreMiContenido,
  TipoDeGrupo,
} from "@/types/database";

/**
 * Una obra con la muestra a la que pertenece y la URL de su foto ya
 * resueltos. La relación puede ser nula: una obra puede sobrevivir a la
 * eliminación de su exposición.
 */
export interface Obra extends ObraRow {
  exposicion: ExposicionBreve | null;
  imagenUrl: string;
}

/** Identificación mínima de una exposición para rotular una obra. */
export interface ExposicionBreve {
  id: string;
  titulo: string;
  slug: string;
  publicada: boolean;
}

/** Una foto de sala con su URL ya resuelta, por el mismo motivo. */
export interface FotoDeSala extends ExposicionFotoRow {
  imagenUrl: string;
}

/**
 * Una foto lista para pintar: la URL ya resuelta y las medidas con que se
 * reserva su espacio. Es la forma mínima que necesitan la portada del Inicio,
 * las tarjetas del índice y la vista ampliada.
 */
export interface FotoLista {
  src: string;
  alt: string;
  ancho: number | null;
  alto: number | null;
}

/**
 * Un grupo de obras con nombre: una exposición o un conjunto de trabajos.
 *
 * Comparten tipo porque comparten tabla y comportamiento; lo que cambia es que
 * la exposición tuvo sala —de ahí `lugar`, `anio` y `fotos`— y el conjunto de
 * trabajos no.
 */
export interface Exposicion extends ExposicionRow {
  fotos: FotoDeSala[];
  obrasPublicadas: number;
  /**
   * La imagen de su tarjeta en el índice: la primera vista de sala si tiene, y
   * si no la primera obra. Un conjunto de trabajos nunca tiene vistas, así que
   * siempre muestra obra.
   */
  portada: FotoLista | null;
}

/** Un bloque de obras de una exposición, con conjunto opcional. */
export interface GrupoDeObras {
  nombre: string | null;
  obras: Obra[];
}

/** Una exposición tal como la muestra su página de obras. */
export interface ExposicionDetalle extends Exposicion {
  obras: Obra[];
  grupos: GrupoDeObras[];
  /** La técnica que comparte la mayoría de sus piezas, si hay alguna. */
  tecnica: string | null;
}

/** Metadatos pequeños que recibe el alta de varias obras ya subidas. */
export interface ObraEnLoteEntrada {
  titulo: string;
  exposicion_id: string | null;
  conjunto: string | null;
  anio: number | null;
  tecnica: string | null;
  dimensiones: string | null;
  imagen_alt: string;
  imagen_path: string;
  imagen_ancho: number | null;
  imagen_alto: number | null;
  destacada: boolean;
  publicada: boolean;
}

export type {
  ClasesContenido,
  ExposicionFotoRow,
  MensajeRow,
  SobreMiContenido,
  TipoDeGrupo,
};
