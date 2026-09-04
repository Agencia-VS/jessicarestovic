import Link from "next/link";
import type { Exposicion } from "@/lib/data/tipos";

interface FiltrosExposicionesProps {
  exposiciones: Exposicion[];
  /** El slug de la muestra abierta, o `null` cuando se ven todas. */
  activo: string | null;
}

/**
 * La fila de muestras que hace de filtro. Son enlaces, no botones: cada
 * exposición tiene su propia dirección, así se puede compartir y el buscador
 * la indexa —lo que la maqueta resolvía con estado en el navegador.
 */
export function FiltrosExposiciones({ exposiciones, activo }: FiltrosExposicionesProps) {
  const opciones = [
    { slug: null, titulo: "Todas", href: "/exposiciones" },
    ...exposiciones.map(({ slug, titulo }) => ({
      slug,
      titulo,
      href: `/exposiciones/${slug}`,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-x-[clamp(0.75rem,1.6vw,1.625rem)] gap-y-2.5 border-t border-line pt-[clamp(1.125rem,2.2vw,1.75rem)] pb-[clamp(1.875rem,4vw,3.5rem)]">
      {opciones.map(({ slug, titulo, href }) => {
        const seleccionado = slug === activo;

        return (
          <Link
            key={href}
            href={href}
            aria-current={seleccionado ? "page" : undefined}
            className={`border-b pb-[3px] text-xs font-light tracking-[0.03em] transition-colors hover:text-ink ${
              seleccionado ? "border-accent text-ink" : "border-transparent text-faint"
            }`}
          >
            {titulo}
          </Link>
        );
      })}
    </div>
  );
}
