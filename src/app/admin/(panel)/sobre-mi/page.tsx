import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioSobreMi } from "@/components/admin/formulario-sobre-mi";
import { obtenerSobreMi } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/imagenes-servidor";

export const metadata = { title: "Sobre mí" };

export default async function SobreMiAdminPage() {
  const contenido = await obtenerSobreMi();

  return (
    <>
      <EncabezadoPanel titulo="Sobre mí" detalle="El retrato y la biografía que se ven en el sitio." />
      <FormularioSobreMi
        contenido={contenido}
        retratoUrl={contenido.retrato_path ? urlImagen(contenido.retrato_path) : null}
      />
    </>
  );
}
