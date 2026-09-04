import type { Metadata } from "next";
import { Pagina, Titulo } from "@/components/site/pagina";
import { CanalesContacto } from "@/components/site/canales-contacto";
import { FormularioContacto } from "@/components/site/formulario-contacto";
import { derivarContacto, siteConfig } from "@/lib/site-config";
import { obtenerConfiguracion } from "@/lib/data/consultas";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escríbele a ${siteConfig.nombre} por WhatsApp o correo: consultas de obra, exposiciones y talleres.`,
  alternates: { canonical: "/contacto" },
};

export default async function ContactoPage() {
  const contacto = derivarContacto(
    await obtenerConfiguracion(),
    "Hola Jessica, te escribo desde tu sitio por una consulta.",
  );

  return (
    <Pagina>
      <div className="mx-auto flex w-full max-w-[75rem] flex-wrap items-start gap-x-[clamp(2rem,5vw,5.5rem)] gap-y-10 gutter pt-[clamp(2.5rem,5.5vw,5.375rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
        <div className="flex min-w-0 flex-[1_1_21.25rem] flex-col gap-[clamp(1.375rem,2.6vw,2.125rem)]">
          <Titulo>Contacto</Titulo>
          <CanalesContacto contacto={contacto} />
        </div>

        <div className="flex min-w-[15.625rem] flex-[0_1_23.75rem] flex-col gap-[clamp(1rem,2vw,1.5rem)]">
          <h2 className="eyebrow text-faint">Escríbeme</h2>
          <FormularioContacto origen="contacto" placeholderMensaje="Mensaje" />
        </div>
      </div>
    </Pagina>
  );
}
