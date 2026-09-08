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
