import Link from "next/link";
import type { Exposicion } from "@/lib/data/tipos";

interface FiltrosExposicionesProps {
  exposiciones: Exposicion[];
  /** El slug del grupo abierto, o `null` cuando se ven todos. */
  activo: string | null;
  /** La sección donde vive la fila: «/exposiciones» o «/trabajos». */
  base?: string;
  /** Cómo se llama la opción que muestra todos. */
  todos?: string;
}

/**
 * La fila de grupos que hace de filtro, en «Exposiciones» y en «Trabajos». Son
 * enlaces, no botones: cada grupo tiene su propia dirección, así se puede
 * compartir y el buscador lo indexa —lo que la maqueta resolvía con estado en
 * el navegador.
 */
export function FiltrosExposiciones({
  exposiciones,
  activo,
  base = "/exposiciones",
  todos = "Todas",
}: FiltrosExposicionesProps) {
  const opciones = [
    { slug: null, titulo: todos, href: base },
    ...exposiciones.map(({ slug, titulo }) => ({
      slug,
      titulo,
      href: `${base}/${slug}`,
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
