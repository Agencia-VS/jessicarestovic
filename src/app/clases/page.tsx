import type { Metadata } from "next";
import { Pagina, Titulo } from "@/components/site/pagina";
import { InteresClases } from "@/components/site/interes-clases";
import { obtenerClases } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Clases",
  description:
    "Talleres de acuarela, monocopia y dibujo con Jessica Restović, en grupos de máximo tres personas.",
  alternates: { canonical: "/clases" },
};

/**
 * Cada técnica se escribe en el panel como «Nombre — descripción», una por
 * línea. Acá se parte en dos para armar la fila: el nombre en serif grande a
 * la izquierda, la descripción menuda a la derecha.
 */
function partirTecnica(linea: string): { nombre: string; detalle: string | null } {
  const [nombre, ...resto] = linea.split(/\s+—\s+/);
  return { nombre: nombre?.trim() ?? linea, detalle: resto.join(" — ").trim() || null };
}

export default async function ClasesPage() {
  const { titulo, introduccion, tecnicas, nota } = await obtenerClases();

  return (
    <Pagina>
      <div className="mx-auto flex w-full max-w-[65rem] flex-col gap-[clamp(2rem,4vw,4rem)] gutter pt-[clamp(2.5rem,5.5vw,5.375rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <div className="flex flex-col gap-[clamp(1.25rem,2.4vw,2rem)]">
          <Titulo>{titulo}</Titulo>

          {introduccion && (
            <p className="max-w-[52ch] font-display text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-[1.7] font-light text-prose text-pretty">
              {introduccion}
            </p>
          )}

          {tecnicas.length > 0 && (
            <div className="flex flex-col border-t border-line">
              {tecnicas.map((linea) => {
                const { nombre, detalle } = partirTecnica(linea);

                return (
                  <div
                    key={linea}
                    className="flex items-baseline justify-between gap-5 border-b border-line py-[clamp(0.9375rem,1.8vw,1.5rem)]"
                  >
                    <span className="font-display text-[clamp(1.25rem,2vw,1.6875rem)] font-light -tracking-[0.01em]">
                      {nombre}
                    </span>
                    {detalle && <span className="ficha text-right text-muted">{detalle}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {nota && <p className="ficha max-w-[44ch] text-muted">{nota}</p>}
        </div>

        <InteresClases />
      </div>
    </Pagina>
  );
}
