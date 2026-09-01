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

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Sube una imagen al bucket y devuelve su ruta.
 *
 * El nombre lo genera el servidor a partir de un UUID, así que dos fotos con
 * el mismo nombre de archivo nunca se pisan.
 */
export async function subirImagen(
  supabase: Cliente,
  archivo: File,
  carpeta: "obras" | "exposiciones" | "retratos",
): Promise<{ path: string } | { error: string }> {
  const extension = EXTENSIONES[archivo.type];
  if (!extension) {
    return { error: "Ese formato de foto no se puede usar. Sube un JPG, PNG, WebP o AVIF." };
  }

  const path = `${carpeta}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET_IMAGENES).upload(path, archivo, {
    contentType: archivo.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    return { error: "No pudimos guardar la foto. Vuelve a intentar en un momento." };
  }

  return { path };
}

/** Borra una imagen del bucket. Los errores se ignoran a propósito: si el
 * archivo ya no está, el objetivo igual se cumplió. */
export async function borrarImagen(supabase: Cliente, path: string | null): Promise<void> {
  if (!path || path.startsWith("/") || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET_IMAGENES).remove([path]);
}

/** Toma un archivo de un FormData solo si trae contenido. */
export function archivoDe(formData: FormData, campo: string): File | null {
  const valor = formData.get(campo);
  return valor instanceof File && valor.size > 0 ? valor : null;
}
