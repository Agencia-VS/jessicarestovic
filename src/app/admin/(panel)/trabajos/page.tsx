import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { ListaExposiciones } from "@/components/admin/lista-exposiciones";
import { AvisoQuery } from "@/components/admin/aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarTrabajos } from "@/lib/data/consultas";

export const metadata = { title: "Trabajos" };

/**
 * Los conjuntos de trabajo: lo que no pasó por una sala.
 *
 * Es la misma pantalla que «Exposiciones» porque son la misma cosa —grupos de
 * obra con nombre—; acá no hay lugar ni fotos de montaje que administrar.
 */
export default async function TrabajosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const [trabajos, { aviso }] = await Promise.all([listarTrabajos(false), searchParams]);

  return (
    <>
      <EncabezadoPanel
        titulo="Trabajos"
        detalle="Los conjuntos que aparecen en «Trabajos» del sitio. Arrastra para cambiar su orden."
      >
        <BotonEnlace href="/admin/trabajos/nuevo" variante="primario">
          Nuevo conjunto
        </BotonEnlace>
      </EncabezadoPanel>

      <AvisoQuery clave={aviso} />

      {trabajos.length > 0 ? (
        <ListaExposiciones exposiciones={trabajos} base="/admin/trabajos" conLugar={false} />
      ) : (
        <EstadoVacio
          titulo="Todavía no hay conjuntos de trabajo"
          detalle="Crea el primero con «Nuevo conjunto»: por ejemplo «Ilustraciones en Acuarela» o «Trabajos recientes»."
        />
      )}
    </>
  );
}
