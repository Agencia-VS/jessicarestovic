import type { Contacto } from "@/lib/site-config";

/**
 * Los canales directos, como una ficha: un rótulo menudo y el dato debajo.
 *
 * Antes iban sueltos y en grande, a 25 px, y pesaban más que el formulario de
 * al lado. Jessica los pidió más chicos y más finos: al tamaño del texto, con
 * el mismo rótulo en versalitas que la ficha de una exposición. El rótulo
 * dice además qué abre cada uno, sobre todo el teléfono.
 *
 * El teléfono abre WhatsApp, que es el canal que Jessica usa de verdad y el
 * que reemplaza al widget de chat de Wix (§12) — de ahí que el `aria-label`
 * lo diga, para que nadie llegue ahí por sorpresa.
 */
export function CanalesContacto({ contacto }: { contacto: Contacto }) {
  const canales = [
    {
      rotulo: "Email",
      texto: contacto.email,
      href: `mailto:${contacto.email}`,
      etiqueta: `Escribir a ${contacto.email}`,
      externo: false,
    },
    {
      rotulo: "WhatsApp",
      texto: contacto.telefono,
      href: contacto.whatsappUrl,
      etiqueta: `Escribir por WhatsApp al ${contacto.telefono}`,
      externo: true,
    },
    {
      rotulo: "Instagram",
      texto: contacto.instagram,
      href: contacto.instagramUrl,
      etiqueta: `Ver ${contacto.instagram} en Instagram`,
      externo: true,
    },
  ];

  return (
    <dl className="flex flex-col gap-[clamp(1.125rem,2vw,1.5rem)]">
      {canales.map(({ rotulo, texto, href, etiqueta, externo }) => (
        <div key={href} className="flex flex-col items-start gap-1.5">
          <dt className="etiqueta text-label">{rotulo}</dt>
          <dd>
            <a
              href={href}
              aria-label={etiqueta}
              {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="border-b border-rule-soft pb-[2px] text-[clamp(0.9375rem,1.15vw,1.0625rem)] font-light text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {texto}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  );
}
