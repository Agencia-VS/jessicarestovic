import type { Metadata } from "next";
import Image from "next/image";
import { Pagina } from "@/components/site/pagina";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerSobreMi } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/images";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre mí",
  description: `Biografía de ${siteConfig.nombre}, artista visual.`,
  alternates: { canonical: "/sobre-mi" },
};

export default async function SobreMiPage() {
  const { titulo, biografia, cita, retrato_path, retrato_alt } = await obtenerSobreMi();

  // Un párrafo por línea en blanco, como lo escribe Jessica en el panel.
  const parrafos = biografia
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Pagina>
      <div className="gutter grid grid-cols-1 gap-12 pt-14 pb-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-18 md:pt-18">
        {retrato_path ? (
          <div className="relative aspect-4/5 w-full max-w-80">
            <Image
              src={urlImagen(retrato_path)}
              alt={retrato_alt ?? `Retrato de ${siteConfig.nombre}`}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              priority
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="aspect-4/5 w-full max-w-80 bg-ref-hueso"
            role="img"
            aria-label="Retrato pendiente de cargar"
          />
        )}

        <div className="flex flex-col gap-8">
          <h1 className="font-display text-4xl leading-tight md:text-5xl">{titulo}</h1>

          {parrafos.length > 0 ? (
            <div className="flex max-w-[62ch] flex-col gap-5 text-[0.9375rem] leading-relaxed text-body text-pretty">
              {parrafos.map((parrafo) => (
                <p key={parrafo.slice(0, 40)}>{parrafo}</p>
              ))}
            </div>
          ) : (
            <EstadoVacio
              titulo="La biografía se escribe desde el panel"
              detalle="En «Sobre mí» del panel se cargan el retrato y el texto que van en esta página."
            />
          )}

          {cita && (
            <blockquote className="max-w-[52ch] border-t border-line pt-6 text-[0.9375rem] leading-relaxed text-body text-pretty">
              «{cita}»
            </blockquote>
          )}
        </div>
      </div>
    </Pagina>
  );
}
