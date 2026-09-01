import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { GrillaObras } from "@/components/admin/grilla-obras";
import { AvisoQuery } from "@/components/admin/aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasAdmin } from "@/lib/data/consultas";

export const metadata = { title: "Obras" };

export default async function ObrasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [obras, { aviso }] = await Promise.all([listarObrasAdmin(), searchParams]);

  return (
    <>
      <EncabezadoPanel
        titulo="Obras"
        detalle="Arrastra una tarjeta para cambiar el orden en que se ven en el sitio."
      >
        <BotonEnlace href="/admin/obras/nueva" variante="primario">
          Nueva obra
        </BotonEnlace>
      </EncabezadoPanel>

      <AvisoQuery clave={aviso} />

      {obras.length > 0 ? (
        <GrillaObras obras={obras} />
      ) : (
        <EstadoVacio
          titulo="Todavía no hay obras"
          detalle="Sube la primera con «Nueva obra». Solo necesitas la foto y un título; el resto se puede completar después."
        />
      )}
    </>
  );
}
