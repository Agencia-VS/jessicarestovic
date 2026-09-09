import Link from "next/link";
import { GaleriaObras } from "./galeria-obras";
import { FichaDatos } from "./ficha-datos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import type { GrupoDeObras } from "@/lib/data/tipos";

interface Vecino {
  href: string;
  titulo: string;
}

interface CuerpoDeObrasProps {
  titulo: string;
  descripcion: string | null;
  /** Las obras agrupadas por conjunto; el bloque sin conjunto va primero. */
  grupos: GrupoDeObras[];
  piezas: number;
  tecnica: string | null;
  /** Filas de ficha extra, después de Piezas y Técnica. */
  fichaExtra?: { clave: string; valor: string }[];
  /** El enlace de vuelta: la muestra de la que se entró, o el índice. */
  volver: Vecino;
  anterior?: Vecino;
  siguiente?: Vecino;
  vacio: { titulo: string; detalle: string };
}

/**
 * El cuerpo de obra de un grupo: su ficha, su texto y su retícula agrupada por
 * conjunto.
 *
 * Lo comparten las obras de una exposición y los conjuntos de trabajo, que
 * muestran lo mismo con distinta ficha y distinto camino de vuelta.
 *
 * El bloque sin conjunto va primero y sin encabezado —su encabezado es el
 * `<h1>`—, y cada conjunto con nombre lleva su `<h2>`. Cada grupo es su propia
 * `GaleriaObras`, así que las flechas de la vista ampliada recorren solo el
 * conjunto con el que se abrió.
 */
export function CuerpoDeObras({
  titulo,
  descripcion,
  grupos,
  piezas,
  tecnica,
  fichaExtra = [],
  volver,
  anterior,
  siguiente,
  vacio,
}: CuerpoDeObrasProps) {
  const kicker = [`${piezas} ${piezas === 1 ? "pieza" : "piezas"}`, tecnica]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[75rem] gutter pt-[clamp(1.625rem,3.4vw,3rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
      <Link
        href={volver.href}
        className="eyebrow mb-[clamp(1.625rem,3.4vw,3rem)] inline-block text-faint transition-colors hover:text-ink"
      >
        ← {volver.titulo}
      </Link>

      <div className="flex flex-wrap items-start gap-x-[clamp(1.5rem,5vw,5rem)] gap-y-8 pb-[clamp(1.875rem,4vw,3.625rem)]">
        <div className="flex min-w-0 flex-[1_1_26.25rem] flex-col gap-[clamp(0.75rem,1.6vw,1.25rem)]">
          <span className="etiqueta tracking-[0.2em] text-faint">{kicker}</span>
          <h1 className="font-display text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.02] font-light -tracking-[0.02em]">
            {titulo}
          </h1>
          {descripcion && (
            <p className="max-w-[52ch] font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed font-light text-body text-pretty">
              {descripcion}
            </p>
          )}
        </div>

        <div className="flex min-w-40 flex-[0_1_12.5rem] flex-col pt-[clamp(0.375rem,1vw,0.875rem)]">
          <FichaDatos
            lineas={[
              { clave: "Piezas", valor: String(piezas) },
              { clave: "Técnica", valor: tecnica ?? "—" },
              ...fichaExtra,
            ]}
          />
        </div>
      </div>

      <div className="border-t border-line pt-[clamp(1.5rem,3vw,2.75rem)]">
        {piezas > 0 ? (
          <div className="flex flex-col gap-[clamp(3rem,7vw,6.5rem)]">
            {grupos.map((grupo, indice) => (
              <section
                key={grupo.nombre ?? `sin-conjunto-${indice}`}
                className="flex flex-col gap-6"
              >
                {grupo.nombre && (
                  <h2 className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-tight font-light">
                    {grupo.nombre}
                  </h2>
                )}
                <GaleriaObras obras={grupo.obras} pie="ficha" />
              </section>
            ))}
          </div>
        ) : (
          <EstadoVacio titulo={vacio.titulo} detalle={vacio.detalle} />
        )}
      </div>

      {(anterior || siguiente) && (
        <div className="flex flex-wrap items-baseline justify-between gap-5 border-t border-line pt-[clamp(1.25rem,3vw,2.75rem)]">
          {anterior ? (
            <Link
              href={anterior.href}
              className="eyebrow tracking-[0.15em] text-faint transition-colors hover:text-ink"
            >
              ← {anterior.titulo}
            </Link>
          ) : (
            <span />
          )}
          {siguiente && (
            <Link
              href={siguiente.href}
              className="eyebrow text-right tracking-[0.15em] text-faint transition-colors hover:text-ink"
            >
              {siguiente.titulo} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
