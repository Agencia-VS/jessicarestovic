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

/** Suficiente para que el reencodado no se note en obra fotografiada. */
const CALIDAD = 0.92;

/** WebP conserva transparencia y pesa menos; JPG es el respaldo universal. */
const FORMATO_PREFERIDO = "image/webp";
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

function reencodar(lienzo: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, CALIDAD));
}

function conExtension(nombre: string, tipo: string): string {
  const base = nombre.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.${tipo === FORMATO_PREFERIDO ? "webp" : "jpg"}`;
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
  if (!hayQueEncoger && archivo.size <= PESO_QUE_OBLIGA) return sinTocar;

  const escala = hayQueEncoger ? LADO_MAYOR_MAX / ladoMayor : 1;
  const ancho = Math.max(1, Math.round(medidas.ancho * escala));
  const alto = Math.max(1, Math.round(medidas.alto * escala));

  try {
    const fuente = await decodificar(archivo);
    try {
      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      const pincel = lienzo.getContext("2d");
      if (!pincel) return sinTocar;
      pincel.drawImage(fuente, 0, 0, ancho, alto);

      // Algunos navegadores ignoran el tipo pedido y devuelven PNG, que para
      // una foto pesa más que el original. Se comprueba y se cae a JPG.
      let blob = await reencodar(lienzo, FORMATO_PREFERIDO);
      if (!blob || blob.type !== FORMATO_PREFERIDO) {
        blob = await reencodar(lienzo, FORMATO_RESPALDO);
      }
      // Si la copia no pesa menos, el original es mejor: se sube tal cual.
      if (!blob || blob.size >= archivo.size) return sinTocar;

      return {
        archivo: new File([blob], conExtension(archivo.name, blob.type), { type: blob.type }),
        ancho,
        alto,
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
