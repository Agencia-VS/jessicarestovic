import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioExposicion } from "@/components/admin/formulario-exposicion";
import { listarSeries } from "@/lib/data/consultas";

export const metadata = { title: "Nueva exposición" };

export default async function NuevaExposicionPage() {
  const series = await listarSeries();

  return (
    <>
      <EncabezadoPanel
        titulo="Nueva exposición"
        detalle="Solo el título es obligatorio. Lugar, año, descripción y fotos se pueden completar después."
      />
      <FormularioExposicion series={series} />
    </>
  );
}
