import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioPortada } from "@/components/admin/formulario-portada";
import { obtenerConfiguracion } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/imagenes-servidor";

export const metadata = { title: "Inicio" };

export default async function InicioAdminPage() {
  const contenido = await obtenerConfiguracion();

  return (
    <>
      <EncabezadoPanel
        titulo="Inicio"
        detalle="La foto y la frase que aparecen en la portada del sitio."
      />
      <FormularioPortada
        contenido={contenido}
        portadaUrl={contenido.portada_path ? urlImagen(contenido.portada_path) : null}
      />
    </>
  );
}
