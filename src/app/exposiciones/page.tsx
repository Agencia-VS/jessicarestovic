import type { Metadata } from "next";
import { Pagina, Seccion } from "@/components/site/pagina";
import { FiltrosExposiciones } from "@/components/site/filtros-exposiciones";
import { PortadasExposiciones } from "@/components/site/mosaico-vistas";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarExposiciones } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Exposiciones",
  description:
    "Trayectoria de exposiciones de Jessica Restović: muestras individuales y colectivas en Chile y el extranjero.",
  alternates: { canonical: "/exposiciones" },
};

export default async function ExposicionesPage() {
  const exposiciones = await listarExposiciones();

  return (
    <Pagina>
      <Seccion
        titulo="Exposiciones"
        conteo={
          exposiciones.length > 0
            ? `${exposiciones.length} ${exposiciones.length === 1 ? "exposición" : "exposiciones"}`
            : undefined
        }
      >
        {exposiciones.length > 0 ? (
          <>
            <FiltrosExposiciones exposiciones={exposiciones} activo={null} />
            <PortadasExposiciones exposiciones={exposiciones} />
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
