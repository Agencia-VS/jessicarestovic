/**
 * Reduce una foto en el navegador, antes de subirla.
 *
 * Las fotos que le llegan a Jessica vienen de cámara o de un fotógrafo: 5000 px
 * de lado y hasta 24 MB. Ese archivo no aporta nada en pantalla —el sitio
 * muestra la obra a 1440 px de ancho como máximo, y `next/image` genera las
 * versiones desde ahí—, no cabe en el bucket de Storage y tarda minutos en
 * subir. Así que el navegador la achica y la reencoda: lo que viaja son dos o
 * tres megas y ella no tiene que preparar nada.
 *
 * Se hace en el navegador a propósito: los bytes nunca pasan por una Server
 * Action —el tope de cuerpo en Vercel son 4,5 MB— y el archivo original no sale
 * del computador ni se modifica; lo que se sube es una copia.
 */

import { TOPE_DE_SUBIDA } from "./images";

const MB = 1024 * 1024;

/**
 * El lado mayor de la copia que se sube.
 *
 * 3000 px cubre el uso más exigente que tiene el sitio —la vista ampliada, que
 * ocupa unos 2000 px de pantalla en un monitor grande con densidad doble— y
 * `next/image` nunca agranda más allá del original, así que subir más solo
 * ocuparía espacio.
 */
export const LADO_MAYOR_MAX = 3000;

/** Sobre este peso conviene reencodar aunque las medidas ya estén bien. */
const PESO_QUE_OBLIGA = 6 * MB;

/**
 * Los intentos, del mejor al peor, hasta que la copia entre en el tope.
 *
 * Primero se cede calidad, que casi no se nota en obra fotografiada, y solo
 * después tamaño. Con JPEG suele bastar el primero; con PNG, que ignora la
 * calidad, el que manda es la escala.
 */
const INTENTOS: ReadonlyArray<{ escala: number; calidad: number }> = [
  { escala: 1, calidad: 0.92 },
  { escala: 1, calidad: 0.82 },
  { escala: 0.75, calidad: 0.82 },
  { escala: 0.55, calidad: 0.78 },
];

/**
 * La copia mantiene el formato del original.
 *
 * Antes se reencodaba todo a WebP, que pesa menos. Salió mal: las fotos de
 * obra dejaron de verse mientras las vistas de sala —que no pasan por acá y
 * siguen siendo JPEG— se veían bien. La copia deja de cambiar de formato: lo
 * único que cambia es el tamaño.
 *
 * Los formatos que un lienzo sabe escribir. Cualquier otro —AVIF, o un archivo
 * que llegó sin tipo— sale como JPG, que es el respaldo universal.
 */
const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const FORMATO_RESPALDO = "image/jpeg";

export interface Medidas {
  ancho: number;
  alto: number;
}

export interface FotoReducida extends Medidas {
  /** El archivo que hay que subir: la copia reducida, o el original. */
  archivo: File;
  /** `false` cuando la foto ya era chica y se sube tal cual. */
  reducida: boolean;
}

/**
 * Las medidas reales de una foto, leídas de su vista previa.
 *
 * Vive acá, junto al tipo `Medidas`, porque las tres vías de subida la
 * necesitan y cada una la tenía escrita a mano con su propio mensaje de error.
 */
export function medirImagen(url: string): Promise<Medidas> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    imagen.onerror = () => rechazar(new Error("No pudimos leer esa foto."));
    imagen.src = url;
  });
}

/** Decodifica el archivo. `createImageBitmap` no existe en Safari antiguos. */
async function decodificar(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") return createImageBitmap(archivo);

  const url = URL.createObjectURL(archivo);
  try {
    return await new Promise<HTMLImageElement>((resolver, rechazar) => {
      const imagen = new Image();
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () => rechazar(new Error("No pudimos leer la foto."));
      imagen.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cerrar(fuente: ImageBitmap | HTMLImageElement): void {
  if ("close" in fuente) fuente.close();
}

function reencodar(lienzo: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, calidad));
}

function conExtension(nombre: string, tipo: string): string {
  const base = nombre.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.${EXTENSION_POR_TIPO[tipo] ?? "jpg"}`;
}

/**
 * Devuelve la copia que hay que subir y sus medidas reales.
 *
 * Nunca falla hacia afuera: si el navegador no puede reencodar, se sigue con el
 * original y es Storage quien decide. Vale más una subida que quizá se rechaza
 * que un error que deja a Jessica sin camino.
 */
export async function reducirImagen(archivo: File, medidas: Medidas): Promise<FotoReducida> {
  const sinTocar: FotoReducida = { archivo, ...medidas, reducida: false };

  const ladoMayor = Math.max(medidas.ancho, medidas.alto);
  const hayQueEncoger = ladoMayor > LADO_MAYOR_MAX;
  // Un archivo sin tipo reconocible hay que reencodarlo aunque sea chico: la
  // firma de la subida necesita un tipo que sepa nombrar.
  const faltaFormato = !EXTENSION_POR_TIPO[archivo.type];
  if (!hayQueEncoger && archivo.size <= PESO_QUE_OBLIGA && !faltaFormato) return sinTocar;

  const escalaBase = hayQueEncoger ? LADO_MAYOR_MAX / ladoMayor : 1;
  const deseado = EXTENSION_POR_TIPO[archivo.type] ? archivo.type : FORMATO_RESPALDO;

  try {
    const fuente = await decodificar(archivo);
    try {
      const lienzo = document.createElement("canvas");
      const pincel = lienzo.getContext("2d");
      if (!pincel) return sinTocar;

      let mejor: { blob: Blob; ancho: number; alto: number } | null = null;

      for (const intento of INTENTOS) {
        const escala = escalaBase * intento.escala;
        const ancho = Math.max(1, Math.round(medidas.ancho * escala));
        const alto = Math.max(1, Math.round(medidas.alto * escala));

        lienzo.width = ancho;
        lienzo.height = alto;
        pincel.clearRect(0, 0, ancho, alto);
        pincel.drawImage(fuente, 0, 0, ancho, alto);

        // Si el navegador ignora el tipo pedido y devuelve otra cosa, se cae a
        // JPG, que todo lienzo sabe escribir.
        let blob = await reencodar(lienzo, deseado, intento.calidad);
        if (!blob || blob.type !== deseado) {
          blob = await reencodar(lienzo, FORMATO_RESPALDO, intento.calidad);
        }
        if (!blob) continue;

        mejor = { blob, ancho, alto };
        if (blob.size <= TOPE_DE_SUBIDA) break;
      }

      if (!mejor) return sinTocar;

      // Si la copia no pesa menos y el original ya entraba tal cual, el
      // original es mejor. Si el original no entra en el bucket, la copia se
      // usa igual: es la única con opción de subir.
      const originalSirve =
        !faltaFormato && archivo.size <= TOPE_DE_SUBIDA && mejor.blob.size >= archivo.size;
      if (originalSirve) return sinTocar;

      return {
        archivo: new File([mejor.blob], conExtension(archivo.name, mejor.blob.type), {
          type: mejor.blob.type,
        }),
        ancho: mejor.ancho,
        alto: mejor.alto,
        reducida: true,
      };
    } finally {
      cerrar(fuente);
    }
  } catch {
    return sinTocar;
  }
}

/** El aviso que se muestra cuando una foto se subió reducida. */
export function avisoDeReduccion(original: File, copia: FotoReducida): string | null {
  if (!copia.reducida) return null;
  const antes = (original.size / MB).toFixed(1);
  const despues = (copia.archivo.size / MB).toFixed(1);
  return `Se subió una copia optimizada de ${copia.ancho} × ${copia.alto} px (${despues} MB en vez de ${antes} MB). El archivo original no se modificó.`;
}
