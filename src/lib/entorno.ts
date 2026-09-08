import { normalizarUrl, urlORespaldo } from "./url";

/**
 * Lectura de las variables de entorno, en un solo lugar y solo en el servidor.
 *
 * Ninguna lleva el prefijo `NEXT_PUBLIC_` a propósito: nada del navegador las
 * necesita, y sin ese prefijo Next no las inyecta en el bundle del cliente —
 * ahí quedarían como `undefined`. Por eso este módulo es de servidor: solo lo
 * importan Server Components, Server Actions, el proxy y los route handlers de
 * `sitemap.ts` y `robots.ts`.
 *
 * (No lleva `import "server-only"` porque ese guard clasifica los route
 * handlers como cliente y rompe el build; la garantía real es el nombre de las
 * variables.)
 *
 * Sobre la clave `anon` de Supabase: Supabase la publica a propósito y toda la
 * protección real vive en las políticas de RLS. Pero como acá el navegador no
 * la usa nunca —el panel entra por server actions y las páginas se renderizan
 * en el servidor— no hay razón para exponerla, y no se expone.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

let cache: SupabaseEnv | null = null;

export function supabaseEnv(): SupabaseEnv {
  if (cache) return cache;

  const url = normalizarUrl(process.env.SUPABASE_URL);
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();

  const faltan = [!url && "SUPABASE_URL", !anonKey && "SUPABASE_ANON_KEY"].filter(Boolean);

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

/**
 * `true` si el sitio está configurado. Permite renderizar el contenido de
 * referencia en vez de reventar cuando todavía no hay proyecto de Supabase.
 */
export function supabaseConfigurado(): boolean {
  return Boolean(normalizarUrl(process.env.SUPABASE_URL) && process.env.SUPABASE_ANON_KEY?.trim());
}

/**
 * URL pública del sitio, para metadatos, sitemap, canónicas y el enlace de
 * recuperación de contraseña. Siempre devuelve algo utilizable.
 */
export function urlDelSitio(): string {
  return urlORespaldo(process.env.SITE_URL, "https://jessicarestovic.com");
}
