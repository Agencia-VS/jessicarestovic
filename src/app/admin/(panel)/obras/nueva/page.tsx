import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { FormularioObra } from "@/components/admin/formulario-obra";
import { listarConjuntos, listarGrupos } from "@/lib/data/consultas";

export const metadata = { title: "Nueva obra" };

export default async function NuevaObraPage({
  searchParams,
}: {
  searchParams: Promise<{ exposicion?: string }>;
}) {
  const [{ exposicion: exposicionInicial }, exposiciones, conjuntos] = await Promise.all([
    searchParams,
    listarGrupos("todos", false),
    listarConjuntos(),
  ]);

  return (
    <>
      <EncabezadoPanel
        titulo="Nueva obra"
        detalle="Una sola foto, con su ficha completa. Año, técnica y medidas son opcionales."
      />
      <FormularioObra
        exposiciones={exposiciones}
        conjuntos={conjuntos}
        exposicionInicial={exposicionInicial}
      />
    </>
  );
}
