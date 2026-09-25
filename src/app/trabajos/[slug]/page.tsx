import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/site/pagina";
import { CuerpoDeObras } from "@/components/site/cuerpo-de-obras";
import { listarTrabajos, obtenerExposicionDetalle } from "@/lib/data/consultas";

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
 * A diferencia de una exposición no hay vistas de sala: no hubo sala que
 * documentar, así que la foto principal es la primera obra.
 */
export default async function TrabajoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [trabajo, trabajos] = await Promise.all([
    obtenerExposicionDetalle(slug),
    listarTrabajos(),
  ]);

  // Un slug de exposición no entra por acá: cada tipo tiene su sección.
  if (!trabajo || trabajo.tipo !== "trabajo") notFound();

  return (
    <Pagina
      subindice={{
        seccion: "Trabajos",
        base: "/trabajos",
        todos: "Todos",
        grupos: trabajos,
        activo: trabajo.slug,
      }}
    >
      <CuerpoDeObras
        titulo={trabajo.titulo}
        descripcion={trabajo.descripcion}
        grupos={trabajo.grupos}
        datos={[
          { clave: "Técnica", valor: trabajo.tecnica },
          { clave: "Año", valor: trabajo.anio ? String(trabajo.anio) : null },
        ]}
        volver={{ href: "/trabajos", titulo: "Trabajos" }}
        vacio={{
          titulo: "Este conjunto todavía no tiene obras publicadas",
          detalle: "Las obras se suben desde el panel y se asignan a este conjunto.",
        }}
      />
    </Pagina>
  );
}
