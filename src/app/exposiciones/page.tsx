import type { Metadata } from "next";
import { Pagina, Encabezado } from "@/components/site/pagina";
import { ExposicionItem } from "@/components/site/exposicion-item";
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
      <Encabezado
        titulo="Exposiciones"
        bajada="Muestras y ferias, de la más reciente a la más antigua. Las que tienen fotos de sala se despliegan al tocarlas."
      />

      <div className="gutter pt-10 pb-8">
        {exposiciones.length > 0 ? (
          <ul className="border-t border-line">
            {exposiciones.map((exposicion) => (
              <ExposicionItem key={exposicion.id} exposicion={exposicion} />
            ))}
          </ul>
        ) : (
          <EstadoVacio
            titulo="Todavía no hay exposiciones publicadas"
            detalle="Las exposiciones se cargan desde el panel, con su lugar, año y fotos de sala."
          />
        )}
      </div>
    </Pagina>
  );
}
