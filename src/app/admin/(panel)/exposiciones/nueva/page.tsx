import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";

export const metadata = { title: "Nueva exposición" };

export default function NuevaExposicionPage() {
  return (
    <>
      <EncabezadoPanel
        titulo="Nueva exposición"
        detalle="Solo el título es obligatorio. Lugar, año, descripción y fotos se pueden completar después."
      />
      <FormularioExposicion />
    </>
  );
}
