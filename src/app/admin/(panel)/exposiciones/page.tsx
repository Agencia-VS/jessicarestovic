import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { ListaExposiciones } from "@/components/admin/lista-exposiciones";
import { AvisoQuery } from "@/components/admin/aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarExposiciones } from "@/lib/data/consultas";

export const metadata = { title: "Exposiciones" };

export default async function ExposicionesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [exposiciones, { aviso }] = await Promise.all([
    listarExposiciones(false),
    searchParams,
  ]);

  return (
    <>
      <EncabezadoPanel
        titulo="Exposiciones"
        detalle="En el sitio se ordenan de la más reciente a la más antigua, según el año."
      >
        <BotonEnlace href="/admin/exposiciones/nueva" variante="primario">
          Nueva exposición
        </BotonEnlace>
      </EncabezadoPanel>

      <AvisoQuery clave={aviso} />

      {exposiciones.length > 0 ? (
        <ListaExposiciones exposiciones={exposiciones} />
      ) : (
        <EstadoVacio
          titulo="Todavía no hay exposiciones"
          detalle="Registra la primera con «Nueva exposición»: título, lugar, año y las fotos de sala."
        />
      )}
    </>
  );
}
