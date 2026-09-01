import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioClases } from "@/components/admin/formulario-clases";
import { obtenerClases } from "@/lib/data/consultas";

export const metadata = { title: "Clases" };

export default async function ClasesAdminPage() {
  const contenido = await obtenerClases();

  return (
    <>
      <EncabezadoPanel titulo="Clases" detalle="El texto y las técnicas de los talleres." />
      <FormularioClases contenido={contenido} />
    </>
  );
}
