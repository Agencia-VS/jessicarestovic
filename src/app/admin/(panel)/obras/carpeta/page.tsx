import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { SubirCarpeta } from "@/components/admin/subir-carpeta";
import { listarConjuntos, listarGrupos } from "@/lib/data/consultas";

export const metadata = { title: "Subir carpeta" };

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
        titulo="Subir carpeta"
        detalle="Revisa los nombres y agrupaciones antes de guardar. Las fotos no se registran como obras hasta que confirmes."
      />
      <SubirCarpeta
        exposiciones={exposiciones}
        conjuntos={conjuntos}
        exposicionInicial={exposicionInicial}
      />
    </>
  );
}
