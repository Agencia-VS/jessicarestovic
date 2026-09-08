import type { Metadata } from "next";
import { Pagina, Seccion } from "@/components/site/pagina";
import { GaleriaObras } from "@/components/site/galeria-obras";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasRecientes } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trabajos recientes",
  description:
    "Lo último de Jessica Restović: las obras cargadas más recientemente, con su serie y su ficha.",
  alternates: { canonical: "/trabajos-recientes" },
};

/**
 * Lo último hecho, sin importar la serie: el orden es el de subida, así que
 * Jessica no tiene que administrar nada para que esta página se actualice —
 * sube la foto y aparece primera.
 */
export default async function TrabajosRecientesPage() {
  const obras = await listarObrasRecientes();

  return (
    <Pagina>
      <Seccion
        titulo="Trabajos recientes"
        conteo={
          obras.length > 0
            ? `${obras.length} ${obras.length === 1 ? "obra" : "obras"}`
            : undefined
        }
      >
        <div className="border-t border-line pt-[clamp(2.125rem,4.4vw,4rem)]">
          {obras.length > 0 ? (
            <GaleriaObras obras={obras} pie="serie" />
          ) : (
            <EstadoVacio
              titulo="Todavía no hay obras publicadas"
              detalle="Cuando Jessica suba su primera obra desde el panel, aparecerá acá."
            />
          )}
        </div>
      </Seccion>
    </Pagina>
  );
}
