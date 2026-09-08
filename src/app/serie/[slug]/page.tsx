import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/site/pagina";
import { GaleriaObras } from "@/components/site/galeria-obras";
import { FichaDatos } from "@/components/site/ficha-datos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarSeries, obtenerSerieDetalle } from "@/lib/data/consultas";

export const revalidate = 300;

export async function generateStaticParams() {
  const series = await listarSeries();
  return series.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const serie = await obtenerSerieDetalle(slug);

  if (!serie) return {};

  return {
    title: serie.nombre,
    description:
      serie.descripcion ?? `${serie.nombre}, serie de obra de Jessica Restović.`,
    alternates: { canonical: `/serie/${slug}` },
  };
}

/**
 * La página de una serie: su descripción, su ficha y todas sus piezas.
 *
 * El enlace de arriba vuelve a la exposición desde la que se entró —«← Sur»,
 * «← Volúmenes»— y no a un índice de obra, que en este diseño no existe.
 */
export default async function SeriePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [serie, series] = await Promise.all([obtenerSerieDetalle(slug), listarSeries()]);

  if (!serie) notFound();

  const piezas = serie.obras.length;
  const kicker = [
    `${piezas} ${piezas === 1 ? "pieza" : "piezas"}`,
    serie.tecnica,
  ]
    .filter(Boolean)
    .join(" · ");

  const posicion = series.findIndex((candidata) => candidata.slug === serie.slug);
  const anterior = series[(posicion - 1 + series.length) % series.length];
  const siguiente = series[(posicion + 1) % series.length];
  const hayVecinas = series.length > 1 && anterior && siguiente;

  const volver = serie.exposicion
    ? { href: `/exposiciones/${serie.exposicion.slug}`, texto: serie.exposicion.titulo }
    : { href: "/exposiciones", texto: "Exposiciones" };

  return (
    <Pagina>
      <div className="mx-auto w-full max-w-[75rem] gutter pt-[clamp(1.625rem,3.4vw,3rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <Link
          href={volver.href}
          className="eyebrow mb-[clamp(1.625rem,3.4vw,3rem)] inline-block text-faint transition-colors hover:text-ink"
        >
          ← {volver.texto}
        </Link>

        <div className="flex flex-wrap items-start gap-x-[clamp(1.5rem,5vw,5rem)] gap-y-8 pb-[clamp(1.875rem,4vw,3.625rem)]">
          <div className="flex min-w-0 flex-[1_1_26.25rem] flex-col gap-[clamp(0.75rem,1.6vw,1.25rem)]">
            <span className="etiqueta tracking-[0.2em] text-faint">{kicker}</span>
            <h1 className="font-display text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.02] font-light -tracking-[0.02em]">
              {serie.nombre}
            </h1>
            {serie.descripcion && (
              <p className="max-w-[52ch] font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed font-light text-body text-pretty">
                {serie.descripcion}
              </p>
            )}
          </div>

          <div className="flex min-w-40 flex-[0_1_12.5rem] flex-col pt-[clamp(0.375rem,1vw,0.875rem)]">
            <FichaDatos
              lineas={[
                { clave: "Piezas", valor: String(piezas) },
                { clave: "Técnica", valor: serie.tecnica ?? "—" },
                { clave: "Expuesta en", valor: serie.exposicion?.titulo ?? "—" },
              ]}
            />
          </div>
        </div>

        <div className="border-t border-line pt-[clamp(1.5rem,3vw,2.75rem)]">
          {piezas > 0 ? (
            <GaleriaObras obras={serie.obras} pie="ficha" />
          ) : (
            <EstadoVacio
              titulo="Esta serie todavía no tiene obras publicadas"
              detalle="Las piezas se suben desde el panel y se asignan a esta serie."
            />
          )}
        </div>

        {hayVecinas && (
          <div className="flex flex-wrap items-baseline justify-between gap-5 border-t border-line pt-[clamp(1.25rem,3vw,2.75rem)]">
            <Link
              href={`/serie/${anterior.slug}`}
              className="eyebrow tracking-[0.15em] text-faint transition-colors hover:text-ink"
            >
              ← {anterior.nombre}
            </Link>
            <Link
              href={`/serie/${siguiente.slug}`}
              className="eyebrow text-right tracking-[0.15em] text-faint transition-colors hover:text-ink"
            >
              {siguiente.nombre} →
            </Link>
          </div>
        )}
      </div>
    </Pagina>
  );
}
