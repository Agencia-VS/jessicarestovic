import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/site/pagina";
import { CuerpoDeObras } from "@/components/site/cuerpo-de-obras";
import { listarExposiciones, obtenerExposicionDetalle } from "@/lib/data/consultas";
import { slugsDeGrupos } from "@/lib/supabase/build";
import { supabaseConfigurado } from "@/lib/entorno";
import { DEMO_EXPOSICIONES } from "@/lib/data/demo";

export const revalidate = 300;

export async function generateStaticParams() {
  if (!supabaseConfigurado()) {
    return DEMO_EXPOSICIONES.filter(({ tipo }) => tipo === "exposicion").map(({ slug }) => ({
      slug,
    }));
  }
  return (await slugsDeGrupos("exposicion")).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exposicion = await obtenerExposicionDetalle(slug);
  if (!exposicion || exposicion.tipo !== "exposicion") return {};

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

  if (!exposicion || exposicion.tipo !== "exposicion") notFound();

  const posicion = exposiciones.findIndex((candidata) => candidata.slug === exposicion.slug);
  const anterior = posicion > 0 ? exposiciones[posicion - 1] : undefined;
  const siguiente = posicion >= 0 ? exposiciones[posicion + 1] : undefined;

  return (
    <Pagina>
      <CuerpoDeObras
        titulo={exposicion.titulo}
        descripcion={exposicion.descripcion}
        grupos={exposicion.grupos}
        piezas={exposicion.obras.length}
        tecnica={exposicion.tecnica}
        fichaExtra={[
          { clave: "Lugar", valor: exposicion.lugar ?? "—" },
          { clave: "Año", valor: exposicion.anio ? String(exposicion.anio) : "—" },
        ]}
        volver={{ href: `/exposiciones/${exposicion.slug}`, titulo: exposicion.titulo }}
        anterior={
          anterior
            ? { href: `/exposiciones/${anterior.slug}/obras`, titulo: anterior.titulo }
            : undefined
        }
        siguiente={
          siguiente
            ? { href: `/exposiciones/${siguiente.slug}/obras`, titulo: siguiente.titulo }
            : undefined
        }
        vacio={{
          titulo: "Esta exposición todavía no tiene obras publicadas",
          detalle: "Las piezas se suben desde el panel y se asignan a esta exposición.",
        }}
      />
    </Pagina>
  );
}
