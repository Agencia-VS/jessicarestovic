/**
 * Utilidades compartidas por el panel y la subida por carpeta.
 *
 * La firma se obtiene en el servidor, pero los bytes viajan directamente a
 * Supabase Storage. Así una foto grande no entra en el body de una Server
 * Action de Vercel.
 */

export type CarpetaImagen = "obras" | "exposiciones" | "retratos";

const EXTENSIONES = "jpg|png|webp|avif";

/** Evita que un formulario manipulado pueda registrar una ruta arbitraria. */
export function rutaDeImagenValida(path: string, carpeta: CarpetaImagen): boolean {
  return new RegExp(`^${carpeta}/[0-9a-f-]{36}\\.(?:${EXTENSIONES})$`).test(path);
}

/**
 * Hace el PUT firmado sin agregar una clave de Supabase ni depender de la
 * sesión del navegador. XMLHttpRequest permite mostrar progreso real de la
 * carga, algo que fetch todavía no expone de forma portable.
 */
export function subirArchivoPorUrl(
  url: string,
  archivo: File,
  alProgresar?: (porcentaje: number) => void,
): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", archivo.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "31536000");
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        alProgresar?.(Math.round((evento.loaded / evento.total) * 100));
      }
    };
    xhr.onerror = () => rechazar(new Error("No pudimos subir la foto."));
    xhr.onabort = () => rechazar(new Error("La subida fue cancelada."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        alProgresar?.(100);
        resolver();
      } else {
        rechazar(new Error("No pudimos subir la foto."));
      }
    };
    xhr.send(archivo);
  });
}
