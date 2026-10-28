import { urlDelSitio } from "@/lib/entorno";
import { metadatosPagina } from "@/lib/metadatos";
import { Pagina, Titulo } from "@/components/site/pagina";
import { CanalesContacto } from "@/components/site/canales-contacto";
import { FormularioContacto } from "@/components/site/formulario-contacto";
import { derivarContacto, siteConfig } from "@/lib/site-config";
import { medicionHabilitada } from "@/lib/comercial/servidor";
import { obtenerConfiguracion, obtenerExposicion } from "@/lib/data/consultas";

export const metadata = metadatosPagina({
  titulo: "Contacto",
  descripcion: `Escríbele a ${siteConfig.nombre} por WhatsApp o correo: consultas de obra, exposiciones y talleres.`,
  ruta: "/contacto",
});

export default async function ContactoPage({ searchParams }: { searchParams: Promise<{ grupo?: string }> }) {
  const { grupo: id } = await searchParams;
  const seleccionado = id && /^[0-9a-f-]{36}$/i.test(id) ? await obtenerExposicion(id) : null;
  const grupo = seleccionado?.publicada ? { id: seleccionado.id, titulo: seleccionado.titulo, ruta: urlDelSitio() + "/" + (seleccionado.tipo === "trabajo" ? "trabajos" : "exposiciones") + "/" + seleccionado.slug } : null;
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
          <h2 className="eyebrow text-faint">Conversemos por WhatsApp</h2>
          <FormularioContacto whatsappUrl={contacto.whatsappUrl} grupo={grupo} captacion={medicionHabilitada()} />
        </div>
      </div>
    </Pagina>
  );
}
