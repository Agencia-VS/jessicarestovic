import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { VistasDeSala } from "@/components/site/vistas-de-sala";
import { Cartela } from "@/components/site/cartela";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarExposiciones, obtenerExposicionPorSlug } from "@/lib/data/consultas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exposicion = await obtenerExposicionPorSlug(slug);

  if (!exposicion || exposicion.tipo !== "exposicion") return {};

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
 * Una exposición con su propio espacio: la foto principal con su cartela y
 * todas sus vistas de montaje.
 *
 * En escritorio la fila de muestras sigue arriba, así se pasa de una a otra
 * sin volver atrás; en el teléfono eso lo hace el desplegable de la cabecera.
 */
export default async function ExposicionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [exposicion, exposiciones] = await Promise.all([
    obtenerExposicionPorSlug(slug),
    listarExposiciones(),
  ]);

  if (!exposicion || exposicion.tipo !== "exposicion") notFound();

  const cartela = (
    <Cartela
      titulo={exposicion.titulo}
      datos={[
        { clave: "Lugar", valor: exposicion.lugar },
        { clave: "Año", valor: exposicion.anio ? String(exposicion.anio) : null },
      ]}
      descripcion={exposicion.descripcion}
    />
  );

  return (
    <Pagina
      subindice={{
        seccion: "Exposiciones",
        base: "/exposiciones",
        todos: "Todas",
        grupos: exposiciones,
        activo: exposicion.slug,
      }}
    >
      <Seccion titulo="Exposiciones" tituloComo="p">
        <FiltrosExposiciones exposiciones={exposiciones} activo={exposicion.slug} />

        {exposicion.fotos.length > 0 ? (
          <VistasDeSala exposicion={exposicion} cartela={cartela} />
        ) : (
          <div className="flex flex-col gap-8">
            {cartela}
            <EstadoVacio
              titulo="Las fotos de esta muestra están pendientes"
              detalle="Las vistas de sala se suben desde el panel, en la ficha de esta exposición."
            />
          </div>
        )}
      </Seccion>
    </Pagina>
  );
}
