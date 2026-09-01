/**
 * Tipos de la base de datos, escritos a mano para que reflejen las migraciones
 * de `supabase/migrations`. Cuando el proyecto de Supabase esté creado se
 * pueden regenerar con:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type MensajeOrigen = "contacto" | "clases";

export type PaginaClave = "sobre-mi" | "clases";

export type SerieRow = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  orden: number;
  creado_en: string;
  actualizado_en: string;
};

export type ObraRow = {
  id: string;
  titulo: string;
  serie_id: string | null;
  anio: number | null;
  tecnica: string | null;
  dimensiones: string | null;
  imagen_path: string;
  imagen_alt: string;
  imagen_ancho: number | null;
  imagen_alto: number | null;
  destacada: boolean;
  publicada: boolean;
  orden: number;
  creado_en: string;
  actualizado_en: string;
};

export type ExposicionRow = {
  id: string;
  titulo: string;
  slug: string;
  lugar: string | null;
  anio: number | null;
  descripcion: string | null;
  publicada: boolean;
  orden: number;
  creado_en: string;
  actualizado_en: string;
};

export type ExposicionFotoRow = {
  id: string;
  exposicion_id: string;
  imagen_path: string;
  imagen_alt: string;
  orden: number;
  creado_en: string;
};

export type ExposicionObraRow = {
  exposicion_id: string;
  obra_id: string;
  orden: number;
};

export type MensajeRow = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  origen: MensajeOrigen;
  leido: boolean;
  creado_en: string;
};

export type PaginaRow = {
  clave: PaginaClave;
  contenido: Record<string, unknown>;
  actualizado_en: string;
};

/** Contenido de la página «Sobre mí», tal como lo guarda el panel. */
export type SobreMiContenido = {
  titulo: string;
  biografia: string;
  cita: string | null;
  retrato_path: string | null;
  retrato_alt: string | null;
};

/** Contenido de la página «Clases». */
export type ClasesContenido = {
  titulo: string;
  introduccion: string;
  tecnicas: string[];
  nota: string | null;
};

/**
 * Forma mínima que `@supabase/supabase-js` necesita para tipar `.from(...)`.
 * `Insert` y `Update` derivan de la fila: la clave y las columnas con default
 * son opcionales al escribir.
 */
type Escribible<T, Generadas extends keyof T> = Aplanado<
  Omit<T, Generadas | ClavesNulables<T>> & Partial<Pick<T, Generadas | ClavesNulables<T>>>
>;

/**
 * Columnas que aceptan `null`. En Postgres una columna nulable sin default se
 * puede omitir al insertar (queda en `null`), así que en `Insert` son
 * opcionales igual que las que tienen default.
 */
type ClavesNulables<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

/**
 * Colapsa una intersección en un único tipo de objeto.
 *
 * Necesario, no cosmético: `postgrest-js` exige que cada tabla cumpla
 * `Record<string, unknown>`, y TypeScript solo infiere una firma de índice
 * implícita para tipos de objeto planos — nunca para intersecciones. Sin este
 * paso, el esquema entero se resuelve a `never` y `.from()` deja de tipar.
 */
type Aplanado<T> = { [K in keyof T]: T[K] };

export type Database = {
  public: {
    Tables: {
      serie: {
        Row: SerieRow;
        Insert: Escribible<SerieRow, "id" | "orden" | "creado_en" | "actualizado_en">;
        Update: Partial<SerieRow>;
        Relationships: [];
      };
      obra: {
        Row: ObraRow;
        Insert: Escribible<
          ObraRow,
          "id" | "destacada" | "publicada" | "orden" | "creado_en" | "actualizado_en"
        >;
        Update: Partial<ObraRow>;
        Relationships: [
          {
            foreignKeyName: "obra_serie_id_fkey";
            columns: ["serie_id"];
            isOneToOne: false;
            referencedRelation: "serie";
            referencedColumns: ["id"];
          },
        ];
      };
      exposicion: {
        Row: ExposicionRow;
        Insert: Escribible<
          ExposicionRow,
          "id" | "publicada" | "orden" | "creado_en" | "actualizado_en"
        >;
        Update: Partial<ExposicionRow>;
        Relationships: [];
      };
      exposicion_foto: {
        Row: ExposicionFotoRow;
        Insert: Escribible<ExposicionFotoRow, "id" | "orden" | "creado_en">;
        Update: Partial<ExposicionFotoRow>;
        Relationships: [
          {
            foreignKeyName: "exposicion_foto_exposicion_id_fkey";
            columns: ["exposicion_id"];
            isOneToOne: false;
            referencedRelation: "exposicion";
            referencedColumns: ["id"];
          },
        ];
      };
      exposicion_obra: {
        Row: ExposicionObraRow;
        Insert: Escribible<ExposicionObraRow, "orden">;
        Update: Partial<ExposicionObraRow>;
        Relationships: [
          {
            foreignKeyName: "exposicion_obra_exposicion_id_fkey";
            columns: ["exposicion_id"];
            isOneToOne: false;
            referencedRelation: "exposicion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exposicion_obra_obra_id_fkey";
            columns: ["obra_id"];
            isOneToOne: false;
            referencedRelation: "obra";
            referencedColumns: ["id"];
          },
        ];
      };
      mensaje: {
        Row: MensajeRow;
        Insert: Escribible<MensajeRow, "id" | "leido" | "creado_en">;
        Update: Partial<MensajeRow>;
        Relationships: [];
      };
      pagina: {
        Row: PaginaRow;
        Insert: Escribible<PaginaRow, "contenido" | "actualizado_en">;
        Update: Partial<PaginaRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { mensaje_origen: MensajeOrigen };
    CompositeTypes: Record<never, never>;
  };
};
