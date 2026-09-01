import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioSobreMi } from "@/components/admin/formulario-sobre-mi";
import { obtenerSobreMi } from "@/lib/data/consultas";

export const metadata = { title: "Sobre mí" };

export default async function SobreMiAdminPage() {
  const contenido = await obtenerSobreMi();

  return (
    <>
      <EncabezadoPanel titulo="Sobre mí" detalle="El retrato y la biografía que se ven en el sitio." />
      <FormularioSobreMi contenido={contenido} />
    </>
  );
}
