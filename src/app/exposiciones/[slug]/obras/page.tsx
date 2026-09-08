import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/site/pagina";
import { GaleriaObras } from "@/components/site/galeria-obras";
import { FichaDatos } from "@/components/site/ficha-datos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import {
  listarExposiciones,
  obtenerExposicionDetalle,
} from "@/lib/data/consultas";
import { slugsDeExposiciones } from "@/lib/supabase/build";
import { supabaseConfigurado } from "@/lib/entorno";
import { DEMO_EXPOSICIONES } from "@/lib/data/demo";

export const revalidate = 300;

export async function generateStaticParams() {
  if (!supabaseConfigurado()) return DEMO_EXPOSICIONES.map(({ slug }) => ({ slug }));
  return (await slugsDeExposiciones()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exposicion = await obtenerExposicionDetalle(slug);
  if (!exposicion) return {};

  return {
    title: `${exposicion.titulo} — Obras`,
    description:
      exposicion.descripcion ??
      `Obras de ${exposicion.titulo}, exposición de Jessica Restović.`,
    alternates: { canonical: `/exposiciones/${slug}/obras` },
  };
}

/** El cuerpo de obra de una exposición, agrupado por conjunto. */
export default async function ObrasDeExposicionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [exposicion, exposiciones] = await Promise.all([
    obtenerExposicionDetalle(slug),
    listarExposiciones(),
  ]);

  if (!exposicion) notFound();

  const piezas = exposicion.obras.length;
  const kicker = [
    `${piezas} ${piezas === 1 ? "pieza" : "piezas"}`,
    exposicion.tecnica,
  ]
    .filter(Boolean)
    .join(" · ");

  const posicion = exposiciones.findIndex((candidata) => candidata.slug === exposicion.slug);
  const anterior = posicion > 0 ? exposiciones[posicion - 1] : undefined;
  const siguiente = posicion >= 0 ? exposiciones[posicion + 1] : undefined;

  return (
    <Pagina>
      <div className="mx-auto w-full max-w-[75rem] gutter pt-[clamp(1.625rem,3.4vw,3rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <Link
          href={`/exposiciones/${exposicion.slug}`}
          className="eyebrow mb-[clamp(1.625rem,3.4vw,3rem)] inline-block text-faint transition-colors hover:text-ink"
        >
          ← {exposicion.titulo}
        </Link>

        <div className="flex flex-wrap items-start gap-x-[clamp(1.5rem,5vw,5rem)] gap-y-8 pb-[clamp(1.875rem,4vw,3.625rem)]">
          <div className="flex min-w-0 flex-[1_1_26.25rem] flex-col gap-[clamp(0.75rem,1.6vw,1.25rem)]">
            <span className="etiqueta tracking-[0.2em] text-faint">{kicker}</span>
            <h1 className="font-display text-[clamp(2rem,4.4vw,3.75rem)] leading-[1.02] font-light -tracking-[0.02em]">
              {exposicion.titulo}
            </h1>
            {exposicion.descripcion && (
              <p className="max-w-[52ch] font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed font-light text-body text-pretty">
                {exposicion.descripcion}
              </p>
            )}
          </div>

          <div className="flex min-w-40 flex-[0_1_12.5rem] flex-col pt-[clamp(0.375rem,1vw,0.875rem)]">
            <FichaDatos
              lineas={[
                { clave: "Piezas", valor: String(piezas) },
                { clave: "Técnica", valor: exposicion.tecnica ?? "—" },
                { clave: "Lugar", valor: exposicion.lugar ?? "—" },
                { clave: "Año", valor: exposicion.anio ? String(exposicion.anio) : "—" },
              ]}
            />
          </div>
        </div>

        <div className="border-t border-line pt-[clamp(1.5rem,3vw,2.75rem)]">
          {piezas > 0 ? (
            <div className="flex flex-col gap-[clamp(3rem,7vw,6.5rem)]">
              {exposicion.grupos.map((grupo, indice) => (
                <section key={grupo.nombre ?? `sin-conjunto-${indice}`} className="flex flex-col gap-6">
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
            <EstadoVacio
              titulo="Esta exposición todavía no tiene obras publicadas"
              detalle="Las piezas se suben desde el panel y se asignan a esta exposición."
            />
          )}
        </div>

        {(anterior || siguiente) && (
          <div className="flex flex-wrap items-baseline justify-between gap-5 border-t border-line pt-[clamp(1.25rem,3vw,2.75rem)]">
            {anterior ? (
              <Link
                href={`/exposiciones/${anterior.slug}/obras`}
                className="eyebrow tracking-[0.15em] text-faint transition-colors hover:text-ink"
              >
                ← {anterior.titulo}
              </Link>
            ) : (
              <span />
            )}
            {siguiente && (
              <Link
                href={`/exposiciones/${siguiente.slug}/obras`}
                className="eyebrow text-right tracking-[0.15em] text-faint transition-colors hover:text-ink"
              >
                {siguiente.titulo} →
              </Link>
            )}
          </div>
        )}
      </div>
    </Pagina>
  );
}
