import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { SubirCarpeta } from "@/components/admin/subir-carpeta";
import { listarConjuntos, listarGrupos } from "@/lib/data/consultas";

export const metadata = { title: "Subir fotos" };

export default async function SubirCarpetaPage({
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
        titulo="Subir fotos"
        detalle="Varias de una vez, o una carpeta completa. Revisa los nombres y las agrupaciones antes de guardar: nada se registra hasta que confirmes."
      />
      <SubirCarpeta
        exposiciones={exposiciones}
        conjuntos={conjuntos}
        exposicionInicial={exposicionInicial}
      />
    </>
  );
}
