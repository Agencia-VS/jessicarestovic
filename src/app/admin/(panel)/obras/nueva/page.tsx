import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioObra } from "@/components/admin/formulario-obra";
import { listarSeries } from "@/lib/data/consultas";

export const metadata = { title: "Nueva obra" };

export default async function NuevaObraPage() {
  const series = await listarSeries();

  return (
    <>
      <EncabezadoPanel
        titulo="Nueva obra"
        detalle="La obra queda publicada al guardar. Año, técnica y medidas son opcionales."
      />
      <FormularioObra series={series} />
    </>
  );
}
