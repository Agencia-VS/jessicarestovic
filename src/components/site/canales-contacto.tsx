import type { Contacto } from "@/lib/site-config";

/**
 * Los canales directos, en serif grande: son el contenido de la página de
 * Contacto, no una lista de datos al costado.
 *
 * El teléfono abre WhatsApp, que es el canal que Jessica usa de verdad y el
 * que reemplaza al widget de chat de Wix (§12) — de ahí que el `aria-label`
 * lo diga, para que nadie llegue ahí por sorpresa.
 */
export function CanalesContacto({ contacto }: { contacto: Contacto }) {
  const canales = [
    {
      texto: contacto.email,
      href: `mailto:${contacto.email}`,
      etiqueta: `Escribir a ${contacto.email}`,
      externo: false,
    },
    {
      texto: contacto.telefono,
      href: contacto.whatsappUrl,
      etiqueta: `Escribir por WhatsApp al ${contacto.telefono}`,
      externo: true,
    },
    {
      texto: contacto.instagram,
      href: contacto.instagramUrl,
      etiqueta: `Ver ${contacto.instagram} en Instagram`,
      externo: true,
    },
  ];

  return (
    <div className="flex flex-col gap-[clamp(0.875rem,1.8vw,1.375rem)]">
      {canales.map(({ texto, href, etiqueta, externo }) => (
        <a
          key={href}
          href={href}
          aria-label={etiqueta}
          {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="self-start border-b border-rule-soft pb-[3px] font-display text-[clamp(1.125rem,1.9vw,1.5625rem)] font-light transition-colors hover:border-accent hover:text-accent"
        >
          {texto}
        </a>
      ))}
    </div>
  );
}
