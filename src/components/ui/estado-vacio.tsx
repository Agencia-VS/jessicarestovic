interface EstadoVacioProps {
  titulo: string;
  detalle?: string;
  children?: React.ReactNode;
}

/**
 * Estado vacío. Aparece mientras una sección todavía no tiene contenido —
 * al montar el sitio, o si Jessica oculta todas las obras de una serie.
 */
export function EstadoVacio({ titulo, detalle, children }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-line px-6 py-12 md:px-10 md:py-16">
      <p className="font-display text-2xl text-ink">{titulo}</p>
      {detalle && <p className="max-w-[48ch] text-sm leading-relaxed text-body">{detalle}</p>}
      {children}
    </div>
  );
}
