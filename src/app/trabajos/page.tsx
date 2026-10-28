import { metadatosPagina } from "@/lib/metadatos";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { TarjetasDeGrupos } from "@/components/site/tarjetas-de-grupos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarTrabajos } from "@/lib/data/consultas";

export const metadata = metadatosPagina({
  titulo: "Trabajos y obras",
  descripcion:
    "Descubre los trabajos de Jessica Restović: acuarelas, ilustraciones y obras recientes. Recorre las imágenes y técnicas de cada conjunto.",
  ruta: "/trabajos",
});

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
    <Pagina
      subindice={{
        seccion: "Trabajos",
        base: "/trabajos",
        todos: "Todos",
        grupos: trabajos,
        activo: null,
      }}
    >
      <Seccion titulo="Trabajos">
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
