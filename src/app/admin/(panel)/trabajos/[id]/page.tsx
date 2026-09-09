import { notFound } from "next/navigation";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";
import { listarObrasDeExposicion, obtenerExposicion } from "@/lib/data/consultas";

export const metadata = { title: "Editar conjunto" };

export default async function EditarTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trabajo, obras] = await Promise.all([
    obtenerExposicion(id),
    listarObrasDeExposicion(id),
  ]);

  // Una muestra se edita en «Exposiciones», donde están sus campos.
  if (!trabajo || trabajo.tipo !== "trabajo") notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={trabajo.titulo}
        detalle="Las obras se suben en «Obras» y se asignan a este conjunto."
      />
      <FormularioExposicion exposicion={trabajo} obras={obras} tipo="trabajo" />
    </>
  );
}
