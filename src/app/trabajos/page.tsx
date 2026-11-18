import { ListadoDeTrabajos } from "@/components/site/listado-de-trabajos";
import { listarTrabajosConObras } from "@/lib/data/consultas";
import { metadatosPagina } from "@/lib/metadatos";
import { SECCIONES_TRABAJO } from "@/lib/site-config";

const seccion = "recientes";

export const metadata = metadatosPagina({
  titulo: SECCIONES_TRABAJO[seccion].label,
  descripcion: "Explora los trabajos recientes de Jessica Restović.",
  ruta: SECCIONES_TRABAJO[seccion].href,
});

export default async function RecientesPage() {
  const conjuntos = await listarTrabajosConObras(seccion);
  return <ListadoDeTrabajos seccion={seccion} conjuntos={conjuntos} />;
}
