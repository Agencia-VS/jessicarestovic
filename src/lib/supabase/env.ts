/**
 * Lectura de las variables de entorno de Supabase en un solo lugar, para que
 * el mensaje de error sea siempre el mismo y diga qué falta.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

let cache: SupabaseEnv | null = null;

export function supabaseEnv(): SupabaseEnv {
  if (cache) return cache;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const faltan = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (!url || !anonKey) {
    throw new Error(
      `Faltan variables de entorno de Supabase: ${faltan.join(", ")}. ` +
        "Copia .env.example a .env.local y completa los valores del proyecto.",
    );
  }

  cache = { url, anonKey };
  return cache;
}

/** `true` si el sitio está configurado. Permite renderizar un estado vacío
 * amable en vez de reventar cuando todavía no hay proyecto de Supabase. */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
