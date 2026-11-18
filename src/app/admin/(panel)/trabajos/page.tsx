import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { ListaExposiciones } from "@/components/admin/lista-exposiciones";
import { AvisoQuery } from "@/components/admin/aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarTrabajos } from "@/lib/data/consultas";
import { OPCIONES_SECCION_TRABAJO } from "@/lib/site-config";

export const metadata = { title: "Trabajos" };

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
        detalle="Crea conjuntos para Ilustraciones y Recientes. Puedes cambiar su orden dentro de cada sección."
      >
        <BotonEnlace href="/admin/trabajos/nuevo" variante="primario">
          Nuevo conjunto
        </BotonEnlace>
      </EncabezadoPanel>

      <AvisoQuery clave={aviso} />

      <div className="flex flex-col gap-12">
        {OPCIONES_SECCION_TRABAJO.map(({ valor, etiqueta }) => {
          const conjuntos = trabajos.filter((trabajo) => trabajo.seccion === valor);
          return (
            <section key={valor} aria-labelledby={valor} className="flex flex-col gap-4">
              <h2 id={valor} className="font-display text-xl">{etiqueta}</h2>
              {conjuntos.length > 0 ? (
                <ListaExposiciones exposiciones={conjuntos} base="/admin/trabajos" conLugar={false} />
              ) : (
                <EstadoVacio titulo="Todavía no hay conjuntos en esta sección" />
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
