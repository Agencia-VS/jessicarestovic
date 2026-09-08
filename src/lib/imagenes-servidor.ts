import { BUCKET_IMAGENES } from "./images";
import { normalizarUrl } from "./url";

/**
 * URL pública de una imagen guardada.
 *
 * Vive aparte de `images.ts` porque necesita la URL de Supabase, y `images.ts`
 * sí lo importan componentes de cliente para validar archivos antes de
 * subirlos. Los componentes de cliente que muestran
 * fotos reciben la URL ya resuelta como dato, no la arman.
 *
 * Un `path` que empieza con `/` es un archivo local de `public/` — lo usan las
 * imágenes de referencia. Cualquier otro es un objeto del bucket.
 */
export function urlImagen(path: string): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;

  const base = normalizarUrl(process.env.SUPABASE_URL);
  if (!base) return path;
  return `${base}/storage/v1/object/public/${BUCKET_IMAGENES}/${path}`;
}
