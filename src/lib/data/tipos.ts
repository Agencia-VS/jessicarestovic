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

/** Una exposición con sus fotos de sala y la serie que expuso. */
export interface Exposicion extends ExposicionRow {
  fotos: ExposicionFotoRow[];
  serie: { id: string; nombre: string; slug: string } | null;
}

/**
 * Una serie tal como la muestra su página: sus obras, la técnica deducida de
 * ellas y la muestra por la que se entró.
 */
export interface SerieDetalle extends SerieConObras {
  /** La técnica que comparte la mayoría de sus piezas, si hay alguna. */
  tecnica: string | null;
  /** La exposición que la mostró, para el enlace de vuelta. */
  exposicion: { titulo: string; slug: string } | null;
}

export type { ClasesContenido, ExposicionFotoRow, MensajeRow, SobreMiContenido };
