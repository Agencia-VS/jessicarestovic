import { notFound } from "next/navigation";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";
import { ObrasDelGrupo } from "@/components/admin/obras-del-grupo";
import { listarObrasDeExposicion, obtenerExposicion } from "@/lib/data/consultas";

export const metadata = { title: "Editar conjunto" };

export default async function EditarTrabajoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const [trabajo, obras, { aviso }] = await Promise.all([
    obtenerExposicion(id),
    listarObrasDeExposicion(id),
    searchParams,
  ]);

  // Una muestra se edita en «Exposiciones», donde están sus campos.
  if (!trabajo || trabajo.tipo !== "trabajo") notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={trabajo.titulo}
        detalle="El nombre y la descripción del conjunto. Las fotos se suben más abajo."
      />
      <FormularioExposicion exposicion={trabajo} tipo="trabajo" />
      <ObrasDelGrupo grupo={trabajo} obras={obras} aviso={aviso} />
    </>
  );
}
