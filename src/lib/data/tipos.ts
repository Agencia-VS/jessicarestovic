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

/** Una serie con sus obras, para la galería agrupada de `/obra`. */
export interface SerieConObras extends Serie {
  obras: Obra[];
}

/** Una exposición con sus fotos de sala. */
export interface Exposicion extends ExposicionRow {
  fotos: ExposicionFotoRow[];
}

export type { ClasesContenido, ExposicionFotoRow, MensajeRow, SobreMiContenido };
