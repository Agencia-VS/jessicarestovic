import type { Obra } from "@/lib/data/tipos";

/** Los datos de ficha que existan, en el orden del mockup. */
export function datosObra(obra: Obra): string[] {
  return [obra.tecnica, obra.dimensiones, obra.anio ? String(obra.anio) : null].filter(
    (dato): dato is string => Boolean(dato),
  );
}

interface ObraPieProps {
  obra: Obra;
  /** `completo` agrega técnica, medidas y año además del título. */
  variante?: "titulo" | "completo";
}

/**
 * Pie de obra: título en tinta, ficha técnica apagada. Los campos opcionales
 * simplemente no aparecen si están en blanco (§07, paso 4 del flujo).
 */
export function ObraPie({ obra, variante = "titulo" }: ObraPieProps) {
  const datos = variante === "completo" ? datosObra(obra) : [];

  return (
    <figcaption className="caption flex flex-wrap gap-x-5 gap-y-1 text-muted">
      <span className="text-ink">{obra.titulo}</span>
      {datos.map((dato) => (
        <span key={dato}>{dato}</span>
      ))}
    </figcaption>
  );
}
