/**
 * Especificación de imágenes del brief (§08) y utilidades para resolver la URL
 * pública de una imagen.
 *
 * Jessica sube la foto en buena calidad y el sistema se encarga del resto:
 * `next/image` genera las versiones para celular y escritorio y las sirve en
 * AVIF o WebP. Por eso acá solo validamos lo que ella no puede arreglar
 * después: que la foto tenga resolución suficiente y no pese demasiado.
 */

const MB = 1024 * 1024;

export interface EspecImagen {
  /** Etiqueta que se muestra como ayuda en el formulario de subida. */
  uso: string;
  proporcion: string;
  /** Lado mayor mínimo en píxeles, o `null` si no aplica. */
  ladoMayorMin: number | null;
  anchoMin: number | null;
  altoMin: number | null;
  pesoMaxBytes: number;
  formatos: readonly string[];
}

export const ESPECS_IMAGEN = {
  obra: {
    uso: "Obra en la galería",
    proporcion: "Proporción real de la obra, sin recorte forzado",
    ladoMayorMin: 1800,
    anchoMin: null,
    altoMin: null,
    pesoMaxBytes: 15 * MB,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  destacada: {
    uso: "Destacada de Inicio",
    proporcion: "Horizontal, libre",
    ladoMayorMin: 2400,
    anchoMin: 2400,
    altoMin: 1600,
    pesoMaxBytes: 10 * MB,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  retrato: {
    uso: "Foto de perfil (Sobre mí)",
    proporcion: "Vertical 4:5",
    ladoMayorMin: null,
    anchoMin: 1600,
    altoMin: 2000,
    pesoMaxBytes: 10 * MB,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  exposicion: {
    uso: "Fotos de exposición (sala, montaje)",
    proporcion: "Horizontal preferente",
    ladoMayorMin: 2000,
    anchoMin: null,
    altoMin: null,
    pesoMaxBytes: 10 * MB,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
} as const satisfies Record<string, EspecImagen>;

export type TipoImagen = keyof typeof ESPECS_IMAGEN;

/** Ayuda contextual para mostrar dentro del formulario de subida. */
export function ayudaImagen(tipo: TipoImagen): string {
  const spec = ESPECS_IMAGEN[tipo];
  const minimo = spec.ladoMayorMin
    ? `${spec.ladoMayorMin} px en el lado mayor`
    : `${spec.anchoMin} × ${spec.altoMin} px`;
  return `${spec.proporcion}. Mínimo ${minimo}, hasta ${Math.round(spec.pesoMaxBytes / MB)} MB. JPG, PNG, WebP o AVIF.`;
}

/**
 * Valida el archivo contra la spec. Devuelve un mensaje en lenguaje simple
 * —sin vocabulario técnico (§07)— o `null` si está todo bien.
 */
export function validarArchivo(archivo: File, tipo: TipoImagen): string | null {
  const spec = ESPECS_IMAGEN[tipo];

  const formatos: readonly string[] = spec.formatos;
  if (!formatos.includes(archivo.type)) {
    return "Ese archivo no es una foto que podamos usar. Sube un JPG, PNG, WebP o AVIF.";
  }
  if (archivo.size > spec.pesoMaxBytes) {
    const max = Math.round(spec.pesoMaxBytes / MB);
    const peso = (archivo.size / MB).toFixed(1);
    return `La foto pesa ${peso} MB y el máximo es ${max} MB. Prueba con una versión más liviana.`;
  }
  return null;
}

/** Valida las dimensiones ya leídas de la imagen. `null` si están bien. */
export function validarDimensiones(
  ancho: number,
  alto: number,
  tipo: TipoImagen,
): string | null {
  const spec = ESPECS_IMAGEN[tipo];
  const ladoMayor = Math.max(ancho, alto);

  if (spec.ladoMayorMin !== null && ladoMayor < spec.ladoMayorMin) {
    return `La foto mide ${ancho} × ${alto} px y necesita al menos ${spec.ladoMayorMin} px en su lado más largo para verse nítida.`;
  }
  if (spec.anchoMin !== null && ancho < spec.anchoMin) {
    return `La foto necesita al menos ${spec.anchoMin} px de ancho y tiene ${ancho} px.`;
  }
  if (spec.altoMin !== null && alto < spec.altoMin) {
    return `La foto necesita al menos ${spec.altoMin} px de alto y tiene ${alto} px.`;
  }
  return null;
}

export const BUCKET_IMAGENES = "obras";

/**
 * URL pública de una imagen guardada.
 *
 * Un `path` que empieza con `/` es un archivo local de `public/` — lo usan las
 * imágenes de referencia del demo. Cualquier otro es un objeto del bucket de
 * Supabase Storage.
 */
export function urlImagen(path: string): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET_IMAGENES}/${path}`;
}

/**
 * Proporción de la obra para reservar el espacio en la retícula sin recortar
 * (§08). Si no se conocen las dimensiones, cae a 4:5 vertical, la proporción
 * más común de su obra.
 */
export function proporcion(ancho: number | null, alto: number | null): number {
  if (ancho && alto && ancho > 0 && alto > 0) return ancho / alto;
  return 4 / 5;
}
