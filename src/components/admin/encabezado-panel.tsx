interface EncabezadoPanelProps {
  titulo: string;
  detalle?: string;
  children?: React.ReactNode;
}

/** Encabezado de una sección del panel, con su acción principal a la derecha. */
export function EncabezadoPanel({ titulo, detalle, children }: EncabezadoPanelProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl leading-tight">{titulo}</h1>
        {detalle && <p className="caption max-w-[54ch] text-muted">{detalle}</p>}
      </div>
      {children && <div className="flex shrink-0 gap-3">{children}</div>}
    </div>
  );
}
