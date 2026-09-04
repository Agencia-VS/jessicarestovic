import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioConfiguracion } from "@/components/admin/formulario-configuracion";
import { obtenerConfiguracion } from "@/lib/data/consultas";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionAdminPage() {
  const contenido = await obtenerConfiguracion();

  return (
    <>
      <EncabezadoPanel
        titulo="Configuración"
        detalle="Tus datos de contacto y la frase de portada. Los cambios se ven en el sitio al guardar."
      />
      <FormularioConfiguracion contenido={contenido} />
    </>
  );
}
