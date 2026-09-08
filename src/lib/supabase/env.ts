import { normalizarUrl } from "@/lib/url";

/**
 * Lectura de las variables de entorno de Supabase en un solo lugar, para que
 * el mensaje de error sea siempre el mismo y diga qué falta.
 *
 * La URL se normaliza al leerla: se acepta con o sin esquema, porque el panel
 * de Supabase muestra el host pelado y es fácil pegarlo así.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

let cache: SupabaseEnv | null = null;

export function supabaseEnv(): SupabaseEnv {
  if (cache) return cache;

  const url = normalizarUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const faltan = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (!url || !anonKey) {
    throw new Error(
      `Faltan variables de entorno de Supabase (o están mal escritas): ${faltan.join(", ")}. ` +
        "Copia .env.example a .env.local y completa los valores del proyecto. " +
        "La URL va como https://<ref>.supabase.co",
    );
  }

  cache = { url, anonKey };
  return cache;
}

/** `true` si el sitio está configurado. Permite renderizar un estado vacío
 * amable en vez de reventar cuando todavía no hay proyecto de Supabase. */
export function supabaseConfigurado(): boolean {
  return Boolean(
    normalizarUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
