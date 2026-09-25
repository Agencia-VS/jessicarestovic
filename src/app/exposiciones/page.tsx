import type { Metadata } from "next";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { TarjetasDeGrupos } from "@/components/site/tarjetas-de-grupos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarExposiciones } from "@/lib/data/consultas";

export const metadata: Metadata = {
  title: "Exposiciones",
  description:
    "Trayectoria de exposiciones de Jessica Restović: muestras individuales y colectivas en Chile y el extranjero.",
  alternates: { canonical: "/exposiciones" },
};

export default async function ExposicionesPage() {
  const exposiciones = await listarExposiciones();

  return (
    <Pagina
      subindice={{
        seccion: "Exposiciones",
        base: "/exposiciones",
        todos: "Todas",
        grupos: exposiciones,
        activo: null,
      }}
    >
      <Seccion titulo="Exposiciones">
        {exposiciones.length > 0 ? (
          <>
            <FiltrosExposiciones exposiciones={exposiciones} activo={null} />
            <TarjetasDeGrupos grupos={exposiciones} hrefDe={({ slug }) => `/exposiciones/${slug}`} />
          </>
        ) : (
          <EstadoVacio
            titulo="Todavía no hay exposiciones publicadas"
            detalle="Las exposiciones se cargan desde el panel, con su lugar, año y fotos de sala."
          />
        )}
      </Seccion>
    </Pagina>
  );
}
