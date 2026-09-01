/**
 * Forma del resultado de una acción del panel.
 *
 * Vive en su propio módulo, sin dependencias del servidor, porque los
 * formularios son componentes de cliente y necesitan el tipo y el valor
 * inicial: si esto viviera junto a los ayudantes de servidor, `next/headers`
 * terminaría en el bundle del navegador.
 *
 * Los mensajes son los que ve Jessica, así que van en lenguaje simple: nunca
 * «registro» ni «asset» (§07, «Principios de uso»).
 */
export interface Resultado {
  estado: "inicial" | "ok" | "error";
  aviso?: string;
  errores?: Record<string, string>;
  /** Valores enviados, para repoblar el formulario si algo falló. */
  valores?: Record<string, string>;
}

export const INICIAL: Resultado = { estado: "inicial" };

export function ok(aviso: string): Resultado {
  return { estado: "ok", aviso };
}

export function fallo(aviso: string, errores?: Record<string, string>): Resultado {
  return { estado: "error", aviso, errores };
}

/** Error de una acción que exige sesión y no la encuentra. */
export const SIN_SESION = fallo("Tu sesión expiró. Vuelve a entrar para guardar los cambios.");
