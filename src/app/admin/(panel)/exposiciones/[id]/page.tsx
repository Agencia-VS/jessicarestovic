import { notFound } from "next/navigation";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";
import { ObrasDelGrupo } from "@/components/admin/obras-del-grupo";
import { listarObrasDeExposicion, obtenerExposicion } from "@/lib/data/consultas";

export const metadata = { title: "Editar exposición" };

export default async function EditarExposicionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const [exposicion, obras, { aviso }] = await Promise.all([
    obtenerExposicion(id),
    listarObrasDeExposicion(id),
    searchParams,
  ]);

  // Un conjunto de trabajo se edita en «Trabajos».
  if (!exposicion || exposicion.tipo !== "exposicion") notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={exposicion.titulo}
        detalle="Los datos de la muestra y sus vistas de montaje. Las obras se suben más abajo."
      />
      <FormularioExposicion exposicion={exposicion} />
      <ObrasDelGrupo grupo={exposicion} obras={obras} aviso={aviso} />
    </>
  );
}
