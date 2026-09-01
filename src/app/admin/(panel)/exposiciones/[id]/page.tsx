import { notFound } from "next/navigation";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";
import { obtenerExposicion } from "@/lib/data/consultas";

export const metadata = { title: "Editar exposición" };

export default async function EditarExposicionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exposicion = await obtenerExposicion(id);

  if (!exposicion) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={exposicion.titulo}
        detalle="Las fotos que subas se agregan a las que ya están cargadas."
      />
      <FormularioExposicion exposicion={exposicion} />
    </>
  );
}
