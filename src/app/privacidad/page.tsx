import type { Metadata } from "next";
import { Pagina, Titulo } from "@/components/site/pagina";
import { obtenerConfiguracion } from "@/lib/data/consultas";
import { derivarContacto, siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacidad",
  description: `Qué datos recoge ${siteConfig.url} y para qué se usan.`,
  alternates: { canonical: "/privacidad" },
};

/**
 * La auditoría del sitio en Wix anotó que no había datos legales ni política
 * de privacidad (§03). Como los formularios de Contacto y Clases sí recogen
 * datos, esta página dice exactamente cuáles y para qué — corto y sin
 * vocabulario técnico, como el resto del sitio.
 */
export default async function PrivacidadPage() {
  const contacto = derivarContacto(await obtenerConfiguracion());

  return (
    <Pagina>
      <div className="mx-auto flex w-full max-w-[65rem] flex-col gap-[clamp(1.25rem,2.4vw,2rem)] gutter pt-[clamp(2.5rem,5.5vw,5.375rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <Titulo>Privacidad</Titulo>

        <div className="flex max-w-[62ch] flex-col gap-5 font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.7] font-light text-prose text-pretty">
          <p>
            Los formularios de Contacto y Clases piden nombre, correo, teléfono y mensaje. Se
            guardan para poder responder y nada más: no se venden, no se comparten con terceros
            y no se usan para enviar publicidad.
          </p>
          <p>
            Los mensajes quedan en la base de datos del sitio, a la que solo accede Jessica con
            su clave. Se conservan mientras sirvan para la conversación que iniciaron.
          </p>
          <p>
            El sitio no usa cookies de seguimiento ni herramientas de analítica que perfilen a
            quien lo visita.
          </p>
          <p>
            Para pedir una copia de tus datos o que se borren, escribe a{" "}
            <a
              href={`mailto:${contacto.email}`}
              className="border-b border-rule-soft transition-colors hover:border-accent hover:text-accent"
            >
              {contacto.email}
            </a>
            .
          </p>
        </div>
      </div>
    </Pagina>
  );
}
