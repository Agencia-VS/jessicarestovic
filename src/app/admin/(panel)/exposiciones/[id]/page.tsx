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

  // Un conjunto de trabajo se edita en «Trabajos».
  if (!exposicion || exposicion.tipo !== "exposicion") notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={exposicion.titulo}
        detalle="Los datos de la muestra y sus fotos de sala. Estas imágenes forman la galería de la exposición."
      />
      <FormularioExposicion exposicion={exposicion} />
    </>
  );
}
