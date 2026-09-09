import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/site/pagina";
import { CuerpoDeObras } from "@/components/site/cuerpo-de-obras";
import { listarTrabajos, obtenerExposicionDetalle } from "@/lib/data/consultas";
import { slugsDeGrupos } from "@/lib/supabase/build";
import { supabaseConfigurado } from "@/lib/entorno";
import { DEMO_EXPOSICIONES } from "@/lib/data/demo";

export const revalidate = 300;

export async function generateStaticParams() {
  if (!supabaseConfigurado()) {
    return DEMO_EXPOSICIONES.filter(({ tipo }) => tipo === "trabajo").map(({ slug }) => ({
      slug,
    }));
  }
  return (await slugsDeGrupos("trabajo")).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trabajo = await obtenerExposicionDetalle(slug);
  if (!trabajo || trabajo.tipo !== "trabajo") return {};

  return {
    title: trabajo.titulo,
    description:
      trabajo.descripcion ?? `${trabajo.titulo}, trabajos de Jessica Restović.`,
    alternates: { canonical: `/trabajos/${slug}` },
  };
}

/**
 * Un conjunto de trabajo con sus obras.
 *
 * A diferencia de una exposición no hay nivel intermedio: no hubo sala que
 * documentar, así que la tarjeta del índice lleva directo acá.
 */
export default async function TrabajoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [trabajo, trabajos] = await Promise.all([
    obtenerExposicionDetalle(slug),
    listarTrabajos(),
  ]);

  // Un slug de exposición no entra por acá: cada tipo tiene su sección.
  if (!trabajo || trabajo.tipo !== "trabajo") notFound();

  const posicion = trabajos.findIndex((candidato) => candidato.slug === trabajo.slug);
  const anterior = posicion > 0 ? trabajos[posicion - 1] : undefined;
  const siguiente = posicion >= 0 ? trabajos[posicion + 1] : undefined;

  return (
    <Pagina>
      <CuerpoDeObras
        titulo={trabajo.titulo}
        descripcion={trabajo.descripcion}
        grupos={trabajo.grupos}
        piezas={trabajo.obras.length}
        tecnica={trabajo.tecnica}
        fichaExtra={
          trabajo.anio ? [{ clave: "Año", valor: String(trabajo.anio) }] : []
        }
        volver={{ href: "/trabajos", titulo: "Trabajos" }}
        anterior={
          anterior ? { href: `/trabajos/${anterior.slug}`, titulo: anterior.titulo } : undefined
        }
        siguiente={
          siguiente ? { href: `/trabajos/${siguiente.slug}`, titulo: siguiente.titulo } : undefined
        }
        vacio={{
          titulo: "Este conjunto todavía no tiene obras publicadas",
          detalle: "Las obras se suben desde el panel y se asignan a este conjunto.",
        }}
      />
    </Pagina>
  );
}
