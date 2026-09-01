import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { ListaSeries } from "@/components/admin/lista-series";
import { listarSeries } from "@/lib/data/consultas";

export const metadata = { title: "Series" };

export default async function SeriesAdminPage() {
  const series = await listarSeries();

  return (
    <>
      <EncabezadoPanel
        titulo="Series"
        detalle="Las series agrupan las obras en la galería. Arrastra para cambiar el orden en que aparecen. Si eliminas una serie, sus obras no se borran: quedan sin serie."
      />
      <ListaSeries series={series} />
    </>
  );
}
