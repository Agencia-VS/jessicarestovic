import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { GrillaObras } from "@/components/admin/grilla-obras";
import { AvisoQuery } from "@/components/admin/aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasAdmin } from "@/lib/data/consultas";

export const metadata = { title: "Trabajos recientes" };

export default async function ObrasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [obras, { aviso }] = await Promise.all([listarObrasAdmin(), searchParams]);

  return (
    <>
      <EncabezadoPanel
        titulo="Trabajos recientes"
        detalle="Arrastra las obras dentro de cada exposición para cambiar el orden de su retícula."
      >
        <BotonEnlace href="/admin/trabajos-recientes/nueva" variante="primario">
          Nueva obra
        </BotonEnlace>
        <BotonEnlace href="/admin/trabajos-recientes/carpeta" variante="secundario">
          Subir carpeta
        </BotonEnlace>
      </EncabezadoPanel>

      <AvisoQuery clave={aviso} />

      {obras.length > 0 ? (
        <GrillaObras obras={obras} />
      ) : (
        <EstadoVacio
          titulo="Todavía no hay trabajos"
          detalle="Sube la primera con «Nueva obra». Solo necesitas la foto y un título; el resto se puede completar después."
        />
      )}
    </>
  );
}
