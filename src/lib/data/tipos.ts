import type {
  ClasesContenido,
  ExposicionFotoRow,
  ExposicionRow,
  MensajeRow,
  ObraRow,
  SobreMiContenido,
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

/** Una exposición con sus fotos de sala. */
export interface Exposicion extends ExposicionRow {
  fotos: FotoDeSala[];
  obrasPublicadas: number;
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

export type { ClasesContenido, ExposicionFotoRow, MensajeRow, SobreMiContenido };
