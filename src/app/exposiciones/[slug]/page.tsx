import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { VistasDeSala } from "@/components/site/mosaico-vistas";
import { FichaDatos } from "@/components/site/ficha-datos";
import { EnlaceSuave } from "@/components/site/enlace-suave";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarExposiciones, obtenerExposicionPorSlug } from "@/lib/data/consultas";

export const revalidate = 300;

export async function generateStaticParams() {
  const exposiciones = await listarExposiciones();
  return exposiciones.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exposicion = await obtenerExposicionPorSlug(slug);

  if (!exposicion) return {};

  const lugar = [exposicion.lugar, exposicion.anio].filter(Boolean).join(", ");

  return {
    title: exposicion.titulo,
    description:
      exposicion.descripcion ??
      `${exposicion.titulo}${lugar ? ` — ${lugar}` : ""}, exposición de Jessica Restović.`,
    alternates: { canonical: `/exposiciones/${slug}` },
  };
}

/**
 * Una exposición con su propio espacio: la ficha de la muestra, su texto y
 * todas sus vistas de montaje. La fila de arriba sigue siendo el índice de
 * muestras, así se pasa de una a otra sin volver atrás.
 */
export default async function ExposicionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [exposicion, exposiciones] = await Promise.all([
    obtenerExposicionPorSlug(slug),
    listarExposiciones(),
  ]);

  if (!exposicion) notFound();

  const total = exposicion.fotos.length;

  return (
    <Pagina>
      <Seccion
        titulo="Exposiciones"
        conteo={total > 0 ? `${total} ${total === 1 ? "imagen" : "imágenes"}` : undefined}
      >
        <FiltrosExposiciones exposiciones={exposiciones} activo={exposicion.slug} />

        <div className="flex flex-wrap items-start gap-x-[clamp(1.25rem,4vw,4rem)] gap-y-8 pb-[clamp(1.875rem,4vw,3.5rem)]">
          <div className="flex min-w-0 flex-[1_1_26.25rem] flex-col gap-4">
            <h2 className="font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-tight font-light -tracking-[0.01em]">
              {exposicion.titulo}
            </h2>
            {exposicion.descripcion && (
              <p className="max-w-[52ch] font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed font-light text-body text-pretty">
                {exposicion.descripcion}
              </p>
            )}
          </div>

          <div className="flex min-w-40 flex-[0_1_12.5rem] flex-col gap-[clamp(0.75rem,1.6vw,1.125rem)]">
            <FichaDatos
              lineas={[
                { clave: "Lugar", valor: exposicion.lugar ?? "—" },
                { clave: "Año", valor: exposicion.anio ? String(exposicion.anio) : "—" },
                { clave: "Serie", valor: exposicion.serie?.nombre ?? "—" },
              ]}
            />
            {exposicion.serie && (
              <EnlaceSuave href={`/serie/${exposicion.serie.slug}`} acentuado>
                Ver la serie
              </EnlaceSuave>
            )}
          </div>
        </div>

        {total > 0 ? (
          <VistasDeSala exposicion={exposicion} />
        ) : (
          <EstadoVacio
            titulo="Las fotos de esta muestra están pendientes"
            detalle="Las vistas de sala se suben desde el panel, en la ficha de esta exposición."
          />
        )}
      </Seccion>
    </Pagina>
  );
}
