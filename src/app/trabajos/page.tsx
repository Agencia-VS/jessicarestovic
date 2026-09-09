import type { Metadata } from "next";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { TarjetasDeGrupos } from "@/components/site/tarjetas-de-grupos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarTrabajos } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trabajos",
  description:
    "Los conjuntos de trabajo de Jessica Restović: acuarela, ilustración y lo último salido del taller.",
  alternates: { canonical: "/trabajos" },
};

/**
 * El índice de conjuntos de trabajo: lo que no pasó por una sala.
 *
 * Se comporta como «Exposiciones» porque es lo mismo —grupos de obra con
 * nombre—; lo que cambia es que acá no hay lugar ni año, y la tarjeta lleva
 * directo a las obras en vez de a las vistas de montaje.
 */
export default async function TrabajosPage() {
  const trabajos = await listarTrabajos();

  return (
    <Pagina>
      <Seccion
        titulo="Trabajos"
        conteo={
          trabajos.length > 0
            ? `${trabajos.length} ${trabajos.length === 1 ? "conjunto" : "conjuntos"}`
            : undefined
        }
      >
        {trabajos.length > 0 ? (
          <>
            <FiltrosExposiciones
              exposiciones={trabajos}
              activo={null}
              base="/trabajos"
              todos="Todos"
            />
            <TarjetasDeGrupos
              grupos={trabajos}
              hrefDe={({ slug }) => `/trabajos/${slug}`}
              cuenta="obras"
              conLugar={false}
            />
          </>
        ) : (
          <EstadoVacio
            titulo="Todavía no hay conjuntos de trabajo"
            detalle="Los conjuntos se crean desde el panel, en «Trabajos», y las obras se les asignan al subirlas."
          />
        )}
      </Seccion>
    </Pagina>
  );
}
