import { notFound } from "next/navigation";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioObra } from "@/components/admin/formulario-obra";
import { listarConjuntos, listarExposiciones, obtenerObra } from "@/lib/data/consultas";

export const metadata = { title: "Editar obra" };

export default async function EditarObraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [obra, exposiciones, conjuntos] = await Promise.all([
    obtenerObra(id),
    listarExposiciones(false),
    listarConjuntos(),
  ]);

  if (!obra) notFound();

  return (
    <>
      <EncabezadoPanel
        titulo={obra.titulo}
        detalle="Para cambiar la foto, arrastra una nueva encima de la actual."
      />
      <FormularioObra exposiciones={exposiciones} conjuntos={conjuntos} obra={obra} />
    </>
  );
}
