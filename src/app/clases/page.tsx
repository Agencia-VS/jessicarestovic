import type { Metadata } from "next";
import { Pagina, Encabezado } from "@/components/site/pagina";
import { FormularioContacto } from "@/components/site/formulario-contacto";
import { CanalesContacto } from "@/components/site/canales-contacto";
import { obtenerClases } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Clases",
  description:
    "Talleres de acuarela, monocopia y dibujo con Jessica Restović, en grupos de máximo tres personas.",
  alternates: { canonical: "/clases" },
};

export default async function ClasesPage() {
  const { titulo, introduccion, tecnicas, nota } = await obtenerClases();

  return (
    <Pagina>
      <Encabezado titulo={titulo} bajada={introduccion || null} />

      <div className="gutter grid grid-cols-1 gap-14 pt-10 pb-8 md:grid-cols-2 md:gap-18">
        <div className="flex flex-col gap-10">
          {tecnicas.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="eyebrow text-label">Técnicas</h2>
              <ul className="flex flex-col border-t border-line">
                {tecnicas.map((tecnica) => (
                  <li
                    key={tecnica}
                    className="border-b border-line py-4 text-[1.0625rem] leading-snug"
                  >
                    {tecnica}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nota && <p className="caption max-w-[44ch] text-muted">{nota}</p>}

          <div className="flex flex-col gap-4">
            <h2 className="eyebrow text-label">O escríbeme directo</h2>
            <CanalesContacto mensajeWhatsapp="Hola Jessica, me interesan tus talleres." />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="eyebrow text-label">Quiero información</h2>
          <FormularioContacto
            origen="clases"
            textoBoton="Quiero información"
            placeholderMensaje="Cuéntame qué técnica te interesa y tu disponibilidad."
          />
        </div>
      </div>
    </Pagina>
  );
}
