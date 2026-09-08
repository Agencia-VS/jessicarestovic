import type {
  ClasesContenido,
  ExposicionFotoRow,
  ExposicionRow,
  MensajeRow,
  ObraRow,
  SerieRow,
  SobreMiContenido,
} from "@/types/database";

/** Una obra con el nombre de su serie ya resuelto. */
export interface Obra extends ObraRow {
  serie: { id: string; nombre: string; slug: string } | null;
}

/** Una serie con la cuenta de obras publicadas que la componen. */
export interface Serie extends SerieRow {
  obrasPublicadas: number;
}

/** Una serie con sus obras. */
export interface SerieConObras extends Serie {
  obras: Obra[];
}

/** Identificación mínima de una serie, para los enlaces cruzados. */
export interface SerieBreve {
  id: string;
  nombre: string;
  slug: string;
}

/**
 * Una exposición con sus fotos de sala y las series que expuso.
 *
 * Son varias a propósito: «Ensambles al Cubo» mostró dos, y una muestra
 * colectiva puede reunir más. La lista vacía es el caso de «Fundación
 * Guayasamín», que expuso piezas sueltas.
 */
export interface Exposicion extends ExposicionRow {
  fotos: ExposicionFotoRow[];
  series: SerieBreve[];
}

/**
 * Una serie tal como la muestra su página: sus obras, la técnica deducida de
 * ellas y las muestras en que se expuso.
 */
export interface SerieDetalle extends SerieConObras {
  /** La técnica que comparte la mayoría de sus piezas, si hay alguna. */
  tecnica: string | null;
  /** Las muestras que la expusieron, de la más reciente a la más antigua. */
  exposiciones: { titulo: string; slug: string }[];
}

export type { ClasesContenido, ExposicionFotoRow, MensajeRow, SobreMiContenido };
