import { createClient } from "@/lib/supabase/server";
import { BUCKET_IMAGENES } from "@/lib/images";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export { INICIAL, ok, fallo, SIN_SESION, type Resultado } from "./resultado";

export type Cliente = SupabaseClient<Database>;


/**
 * Devuelve un cliente con sesión verificada, o `null` si no hay sesión.
 *
 * Las políticas de RLS ya bloquean la escritura sin sesión; esta comprobación
 * existe para poder responder con un mensaje claro en vez de un error de
 * base de datos.
 */
export async function clienteConSesion(): Promise<Cliente | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? supabase : null;
}

/** Convierte un campo de formulario en texto, o `null` si vino vacío. */
export function textoONulo(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

/** Convierte un campo de formulario en entero, o `null` si vino vacío. */
export function enteroONulo(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim();
  if (texto === "") return null;
  const numero = Number.parseInt(texto, 10);
  return Number.isNaN(numero) ? null : numero;
}

/** Un checkbox marcado llega como "on". */
export function booleano(valor: FormDataEntryValue | null): boolean {
  return valor === "on" || valor === "true";
}

/** Borra una imagen del bucket. Los errores se ignoran a propósito: si el
 * archivo ya no está, el objetivo igual se cumplió. */
export async function borrarImagen(supabase: Cliente, path: string | null): Promise<void> {
  if (!path || path.startsWith("/") || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET_IMAGENES).remove([path]);
}

/**
 * ¿El archivo llegó de verdad al bucket?
 *
 * Que el PUT firmado respondiera 2xx no garantiza que el objeto quedara ahí.
 * Sin esta comprobación la ficha se guarda apuntando a un archivo inexistente
 * y en el sitio aparece el texto alternativo en vez de la foto, sin ningún
 * error que lo explique.
 */
export async function confirmarSubida(supabase: Cliente, path: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(BUCKET_IMAGENES).info(path);
  return Boolean(data) && !error;
}

/** El aviso cuando el archivo no quedó en Storage. Uno solo, para todas las vías. */
export const FALTA_EN_STORAGE =
  "La foto no quedó disponible en Storage. Vuelve a subirla y espera a que llegue al 100%.";

/**
 * ¿Alguna fila guardada apunta a esta ruta?
 *
 * Es la red de seguridad de las limpiezas. Una subida que no llegó a
 * guardarse hay que borrarla del bucket, pero el código que la borra vive en
 * el navegador —en efectos de desmontaje y en callbacks que pueden dispararse
 * tarde—, y desde ahí no se puede saber si entretanto la foto quedó guardada.
 * Sin esta comprobación, un efecto mal disparado borra obra publicada y no hay
 * vuelta atrás: ya pasó, y es lo que dejó filas apuntando a archivos
 * inexistentes.
 *
 * Las rutas viven en dos columnas y dentro de dos documentos JSON (el retrato
 * de «Sobre mí» y las portadas del Inicio), así que se consultan las tres
 * formas. Como la ruta lleva un UUID, buscarla como texto dentro del documento
 * no puede dar un falso positivo.
 *
 * Ante un error de consulta responde que **sí** está en uso: dejar un archivo
 * huérfano es barato; borrar una foto que sí se usaba, no.
 */
export async function rutaEnUso(supabase: Cliente, path: string): Promise<boolean> {
  if (!path) return false;

  const [obras, fotos, paginas] = await Promise.all([
    supabase.from("obra").select("id", { count: "exact", head: true }).eq("imagen_path", path),
    supabase
      .from("exposicion_foto")
      .select("id", { count: "exact", head: true })
      .eq("imagen_path", path),
    supabase.from("pagina").select("contenido"),
  ]);

  if (obras.error || fotos.error || paginas.error) return true;
  if ((obras.count ?? 0) > 0 || (fotos.count ?? 0) > 0) return true;

  return (paginas.data ?? []).some((fila) => JSON.stringify(fila.contenido).includes(path));
}
