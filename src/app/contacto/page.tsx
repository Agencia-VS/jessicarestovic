import type { Metadata } from "next";
import { Pagina, Encabezado } from "@/components/site/pagina";
import { CanalesContacto } from "@/components/site/canales-contacto";
import { FormularioContacto } from "@/components/site/formulario-contacto";
import { derivarContacto, siteConfig } from "@/lib/site-config";
import { obtenerConfiguracion } from "@/lib/data/consultas";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escríbele a ${siteConfig.nombre} por WhatsApp o correo: consultas de obra, exposiciones y talleres.`,
  alternates: { canonical: "/contacto" },
};

export const revalidate = 300;

export default async function ContactoPage() {
  const contacto = derivarContacto(
    await obtenerConfiguracion(),
    "Hola Jessica, te escribo desde tu sitio por una consulta.",
  );

  return (
    <Pagina>
      <Encabezado
        titulo="Contacto"
        bajada="Para consultas de obra, exposiciones o talleres. Respondo por WhatsApp o correo."
      />

      <div className="gutter grid grid-cols-1 gap-14 pt-10 pb-8 md:grid-cols-2 md:gap-18">
        <CanalesContacto contacto={contacto} />
        <FormularioContacto
          origen="contacto"
          placeholderMensaje="Cuéntame en qué te puedo ayudar."
        />
      </div>
    </Pagina>
  );
}
