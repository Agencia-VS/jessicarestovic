/**
 * Normalización de URLs que vienen de variables de entorno.
 *
 * Dos formas de fallar que ya rompieron un despliegue:
 *
 *  - La variable existe pero está **vacía**. `??` no la atrapa —solo cae al
 *    respaldo con `null` o `undefined`— así que una cadena vacía se cuela
 *    hasta un `new URL("")`, que lanza.
 *  - La variable trae el host pelado (`abc.supabase.co`), que es como lo
 *    muestra el panel de Supabase, sin el `https://` delante.
 *
 * Estas funciones aceptan ambos casos y nunca lanzan: devuelven `null` cuando
 * el valor no se puede interpretar, para que quien llame decida el respaldo.
 * Una variable mal escrita debe degradar el sitio, no impedir que compile.
 *
 * Sin dependencias: lo usan la app y también `next.config.ts`.
 */

/** URL absoluta y sin barra final, o `null` si el valor no sirve. */
export function normalizarUrl(valor: string | undefined | null): string | null {
  const limpio = valor?.trim().replace(/\/+$/, "");
  if (!limpio) return null;

  const conEsquema = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;

  try {
    const url = new URL(conEsquema);
    return url.hostname ? url.origin : null;
  } catch {
    return null;
  }
}

/** Igual que `normalizarUrl`, pero con un respaldo garantizado. */
export function urlORespaldo(valor: string | undefined | null, respaldo: string): string {
  return normalizarUrl(valor) ?? respaldo;
}

/** Host del valor, para `images.remotePatterns`. `null` si no se puede interpretar. */
export function hostDe(valor: string | undefined | null): string | null {
  const url = normalizarUrl(valor);
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
