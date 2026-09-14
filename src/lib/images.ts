/**
 * Especificación de imágenes del brief (§08) y utilidades para resolver la URL
 * pública de una imagen.
 *
 * Jessica sube la foto en buena calidad y el sistema se encarga del resto: el
 * navegador reduce lo que hace falta antes de subirla (`reducir-imagen.ts`) y
 * `next/image` genera las versiones para celular y escritorio y las sirve en
 * AVIF o WebP.
 *
 * Por eso `pesoMaxBytes` es generoso: no es lo que se guarda, es lo más grande
 * que aceptamos leer de su computador. Un archivo de cámara de 24 MB entra sin
 * problema y sube como una copia de dos o tres. Y las medidas mínimas solo
 * advierten, nunca bloquean: una foto disponible siempre es preferible a
 * obligarla a conseguir otra versión.
 */

const MB = 1024 * 1024;

/**
 * Lo más grande que aceptamos leer, no lo que se guarda: el navegador reduce
 * antes de subir. Una foto de cámara de 5000 px y 24 MB tiene que entrar.
 */
const PESO_MAX = 40 * MB;

/**
 * Lo más pesado que Storage acepta de verdad.
 *
 * Es el `file_size_limit` del bucket (`0002_rls_storage.sql`). `PESO_MAX` es
 * otra cosa: lo más grande que aceptamos **leer** del computador, porque el
 * navegador reduce antes de subir. Cuando ese margen no alcanzaba, el PUT moría
 * con un 413 y el aviso hablaba de un tamaño que la validación acababa de dar
 * por bueno.
 */
export const TOPE_DE_SUBIDA = 16 * MB;

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
    pesoMaxBytes: PESO_MAX,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  destacada: {
    uso: "Fotos del tríptico de Inicio",
    proporcion: "Cuadrada de preferencia: en el Inicio se recorta al cuadrado",
    ladoMayorMin: 1600,
    anchoMin: null,
    altoMin: null,
    pesoMaxBytes: PESO_MAX,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  retrato: {
    uso: "Foto de perfil (Sobre mí)",
    proporcion: "Vertical 4:5",
    ladoMayorMin: null,
    // La página la muestra a unos 360 px de ancho. 800 × 1000 deja margen
    // suficiente para pantallas retina sin obligar a Jessica a conseguir un
    // archivo innecesariamente grande.
    anchoMin: 800,
    altoMin: 1000,
    pesoMaxBytes: PESO_MAX,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  exposicion: {
    uso: "Fotos de exposición (sala, montaje)",
    proporcion: "Horizontal preferente",
    ladoMayorMin: 2000,
    anchoMin: null,
    altoMin: null,
    pesoMaxBytes: PESO_MAX,
    formatos: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
} as const satisfies Record<string, EspecImagen>;

export type TipoImagen = keyof typeof ESPECS_IMAGEN;

/** Ayuda contextual para mostrar dentro del formulario de subida. */
export function ayudaImagen(tipo: TipoImagen): string {
  const spec = ESPECS_IMAGEN[tipo];
  const recomendado = spec.ladoMayorMin
    ? `${spec.ladoMayorMin} px en el lado mayor`
    : `${spec.anchoMin} × ${spec.altoMin} px`;
  return `${spec.proporcion}. Recomendado ${recomendado}, hasta ${Math.round(spec.pesoMaxBytes / MB)} MB. JPG, PNG, WebP o AVIF.`;
}

/**
 * Valida el archivo contra la spec. Devuelve un mensaje en lenguaje simple
 * —sin vocabulario técnico (§07)— o `null` si está todo bien.
 */
export function validarArchivo(archivo: File, tipo: TipoImagen): string | null {
  const spec = ESPECS_IMAGEN[tipo];

  // iPhone puede entregar HEIC aunque el selector informe un MIME vacío.
  // Lo detectamos por ambos caminos para dar una salida concreta, no un
  // mensaje genérico de formato inválido.
  const nombre = archivo.name.toLowerCase();
  if (archivo.type === "image/heic" || archivo.type === "image/heif" || /\.(heic|heif)$/.test(nombre)) {
    return "Este formato HEIC no se puede usar. En iPhone: Ajustes → Cámara → Formatos → Más compatible. Si ya tienes la foto, conviértela a JPG.";
  }

  // TIFF merece su propio mensaje: es un formato de escáner y de imprenta muy
  // habitual, y el aviso genérico deja sin saber qué hacer. No se puede
  // aceptar aunque quisiéramos: ningún navegador sabe decodificarlo, así que
  // el panel no puede medirlo, ni mostrar la miniatura, ni reducirlo antes de
  // subir. Convertirlo a JPG es el único camino y conviene decirlo.
  if (archivo.type === "image/tiff" || /\.(tif|tiff)$/.test(nombre)) {
    return "Los archivos TIFF no se pueden usar en el sitio: el navegador no sabe abrirlos. Guárdalo o expórtalo como JPG y súbelo de nuevo.";
  }

  const formatos: readonly string[] = spec.formatos;
  // Algunos sistemas entregan el archivo sin tipo —un AVIF en Windows, por
  // ejemplo—, y rechazarlo por eso sería decirle que su foto no es una foto.
  // Cuando no hay tipo, decide la extensión.
  const tipoConocido = archivo.type
    ? formatos.includes(archivo.type)
    : /\.(jpe?g|png|webp|avif)$/.test(nombre);
  if (!tipoConocido) {
    return "Ese archivo no es una foto que podamos usar. Sube un JPG, PNG, WebP o AVIF.";
  }
  if (archivo.size > spec.pesoMaxBytes) {
    const max = Math.round(spec.pesoMaxBytes / MB);
    const peso = (archivo.size / MB).toFixed(1);
    return `La foto pesa ${peso} MB y el máximo es ${max} MB. Prueba con una versión más liviana.`;
  }
  return null;
}

/**
 * Advierte si una foto puede verse menos nítida. Nunca bloquea la subida: una
 * foto disponible siempre es preferible a obligar a conseguir otra versión.
 */
export function advertirDimensiones(
  ancho: number,
  alto: number,
  tipo: TipoImagen,
): string | null {
  const spec = ESPECS_IMAGEN[tipo];
  const ladoMayor = Math.max(ancho, alto);

  if (spec.ladoMayorMin !== null && ladoMayor < spec.ladoMayorMin) {
    return `La foto mide ${ancho} × ${alto} px. Recomendamos ${spec.ladoMayorMin} px en su lado más largo para mayor nitidez, pero puedes usarla igualmente.`;
  }
  if (spec.anchoMin !== null && ancho < spec.anchoMin) {
    return `La foto tiene ${ancho} px de ancho. Recomendamos ${spec.anchoMin} px para mayor nitidez, pero puedes usarla igualmente.`;
  }
  if (spec.altoMin !== null && alto < spec.altoMin) {
    return `La foto tiene ${alto} px de alto. Recomendamos ${spec.altoMin} px para mayor nitidez, pero puedes usarla igualmente.`;
  }
  return null;
}

export const BUCKET_IMAGENES = "obras";


/**
 * Proporción de la obra para reservar el espacio en la retícula sin recortar
 * (§08). Si no se conocen las dimensiones, cae a 4:5 vertical, la proporción
 * más común de su obra.
 */
export function proporcion(ancho: number | null, alto: number | null): number {
  if (ancho && alto && ancho > 0 && alto > 0) return ancho / alto;
  return 4 / 5;
}

/** Techo suave del mosaico: nada más alto que ~2:1 ni más ancho que 3.2:1. */
const MAS_ALTA = 0.55;
const MAS_ANCHA = 3.2;

/**
 * La misma proporción, con un tope para el mosaico.
 *
 * La foto dicta la altura de su tarjeta, pero sin límite una pieza muy
 * alargada se comería una columna entera. Con el tope, la foto se sigue viendo
 * completa —`object-contain` sobre el mismo fondo del sitio, así el aire de los
 * costados no se nota— y la columna conserva su ritmo. En la vista ampliada la
 * proporción es exacta, sin tope.
 */
export function proporcionEnMosaico(ancho: number | null, alto: number | null): number {
  return Math.min(MAS_ANCHA, Math.max(MAS_ALTA, proporcion(ancho, alto)));
}
