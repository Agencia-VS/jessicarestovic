/**
 * Divide una secuencia de imágenes en filas justificadas. El ancho de cada
 * columna será su proporción, de modo que todas las fotos de una fila
 * compartan altura sin recortar su contenido.
 */
export function filasJustificadas<T>(
  elementos: T[],
  proporcionDe: (elemento: T) => number,
  objetivo = 3.2,
): T[][] {
  if (elementos.length === 0) return [];

  const filas: T[][] = [];
  let fila: T[] = [];
  let suma = 0;

  for (const elemento of elementos) {
    fila.push(elemento);
    suma += Math.max(0.55, Math.min(3.2, proporcionDe(elemento)));

    // Una foto muy panorámica puede justificar una fila por sí sola. En los
    // demás casos esperamos al menos dos piezas para no producir miniaturas.
    if (suma >= objetivo && (fila.length > 1 || suma >= objetivo * 1.35)) {
      filas.push(fila);
      fila = [];
      suma = 0;
    }
  }

  if (fila.length > 0) {
    const anterior = filas.at(-1);
    // Una última pieza sola se lee mejor junto a la fila anterior que estirada
    // a todo el ancho. La proporción sigue dictando su propia columna.
    if (fila.length === 1 && anterior && anterior.length > 1) anterior.push(fila[0]!);
    else filas.push(fila);
  }

  return filas;
}
