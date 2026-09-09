import { createClient as crearCliente } from "@supabase/supabase-js";
import type { Database, TipoDeGrupo } from "@/types/database";
import { supabaseEnv } from "@/lib/entorno";

/**
 * Cliente sin cookies, para `generateStaticParams`.
 *
 * Esa función corre en tiempo de build, sin petición HTTP, así que llamar a
 * `cookies()` ahí lanza y tumba el build entero. Y no hace falta: los slugs de
 * exposiciones son contenido público que el rol `anon` ya puede leer por las
 * políticas de RLS, sin sesión de por medio.
 */
export function createBuildClient() {
  const { url, anonKey } = supabaseEnv();

  return crearCliente<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Los slugs publicados de un tipo de grupo — muestras o conjuntos de trabajo.
 * Vacío si no hay base todavía.
 */
export async function slugsDeGrupos(tipo: TipoDeGrupo): Promise<string[]> {
  const supabase = createBuildClient();
  const { data } = await supabase
    .from("exposicion")
    .select("slug")
    .eq("tipo", tipo)
    .eq("publicada", true);
  return (data ?? []).map(({ slug }) => slug);
}
