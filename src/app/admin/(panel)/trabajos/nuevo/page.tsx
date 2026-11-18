import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";

export const metadata = { title: "Nuevo conjunto" };

export default async function NuevoTrabajoPage() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nuevo conjunto"
        detalle="Indica el nombre y elige la sección. El año y la descripción se pueden completar después."
      />
      <FormularioExposicion tipo="trabajo" />
    </>
  );
}
