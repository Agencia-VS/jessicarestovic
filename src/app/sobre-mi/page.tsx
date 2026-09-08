import type { Metadata } from "next";
import Image from "next/image";
import { Pagina, Titulo } from "@/components/site/pagina";
import { Hueco } from "@/components/site/foto";
import { EnlaceSuave } from "@/components/site/enlace-suave";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { obtenerConfiguracion, obtenerSobreMi } from "@/lib/data/consultas";
import { urlImagen } from "@/lib/images";
import { derivarContacto, siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre mí",
  description: `Biografía de ${siteConfig.nombre}, artista visual.`,
  alternates: { canonical: "/sobre-mi" },
};

export default async function SobreMiPage() {
  const [{ titulo, biografia, retrato_path, retrato_alt }, config] = await Promise.all([
    obtenerSobreMi(),
    obtenerConfiguracion(),
  ]);
  const contacto = derivarContacto(config);

  // Un párrafo por línea en blanco, como lo escribe Jessica en el panel.
  const parrafos = biografia
    .split(/\n{2,}/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);

  return (
    <Pagina>
      <div className="mx-auto flex w-full max-w-[75rem] flex-wrap items-start gap-x-[clamp(2rem,5vw,5.5rem)] gap-y-8 gutter pt-[clamp(2.5rem,5.5vw,5.375rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <div className="min-w-[14.375rem] flex-[0_1_22.5rem]">
          {retrato_path ? (
            <div className="relative aspect-4/5 w-full">
              <Image
                src={urlImagen(retrato_path)}
                alt={retrato_alt ?? `Retrato de ${siteConfig.nombre}`}
                fill
                sizes="(max-width: 48rem) 100vw, 360px"
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <Hueco proporcion={4 / 5} etiqueta="El retrato se carga desde el panel" />
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_25rem] flex-col gap-[clamp(1.125rem,2.2vw,1.875rem)]">
          <Titulo>{titulo}</Titulo>

          {parrafos.length > 0 ? (
            parrafos.map((parrafo) => (
              <p
                key={parrafo.slice(0, 40)}
                className="max-w-[58ch] font-display text-[clamp(1.0625rem,1.6vw,1.375rem)] leading-[1.7] font-light text-prose text-pretty"
              >
                {parrafo}
              </p>
            ))
          ) : (
            <EstadoVacio
              titulo="La biografía se escribe desde el panel"
              detalle="En «Sobre mí» del panel se cargan el retrato y el texto que van en esta página."
            />
          )}

          <div className="flex flex-wrap gap-x-[clamp(1rem,2.4vw,2.25rem)] gap-y-3 border-t border-line pt-[clamp(0.625rem,1.4vw,1.125rem)]">
            <a
              href={contacto.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow self-start border-b border-rule-soft pb-[3px] transition-colors hover:border-accent hover:text-accent"
            >
              Instagram
            </a>
            <EnlaceSuave href="/contacto">Contacto</EnlaceSuave>
          </div>
        </div>
      </div>
    </Pagina>
  );
}
