import type { Metadata } from "next";
import { Pagina } from "@/components/site/pagina";
import { Galeria } from "@/components/site/galeria";
import { listarGaleriaPorSerie } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Obra",
  description:
    "Galería de obra de Jessica Restović, agrupada por serie: Ensambles al Cubo, Espacios Íntimos, Sur, De lo Residual y más.",
  alternates: { canonical: "/obra" },
};

export default async function ObraPage() {
  const grupos = await listarGaleriaPorSerie();

  return (
    <Pagina>
      <h1 className="sr-only">Obra</h1>
      <Galeria grupos={grupos} />
    </Pagina>
  );
}
