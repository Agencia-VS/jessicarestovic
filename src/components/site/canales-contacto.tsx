import { siteConfig, whatsappUrl } from "@/lib/site-config";

const { contacto } = siteConfig;

interface Canal {
  etiqueta: string;
  valor: string;
  href: string;
  externo: boolean;
}

/**
 * Los canales directos. WhatsApp primero: es el que Jessica usa de verdad y
 * reemplaza al widget de chat de Wix (§12).
 */
export function CanalesContacto({ mensajeWhatsapp }: { mensajeWhatsapp?: string }) {
  const canales: Canal[] = [
    {
      etiqueta: "WhatsApp",
      valor: contacto.telefono,
      href: whatsappUrl(mensajeWhatsapp),
      externo: true,
    },
    { etiqueta: "Correo", valor: contacto.email, href: `mailto:${contacto.email}`, externo: false },
    {
      etiqueta: "Instagram",
      valor: contacto.instagram,
      href: contacto.instagramUrl,
      externo: true,
    },
  ];

  return (
    <ul className="flex flex-col border-t border-line">
      {canales.map(({ etiqueta, valor, href, externo }) => (
        <li key={etiqueta} className="border-b border-line">
          <a
            href={href}
            {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group flex items-baseline justify-between gap-6 py-4.5 transition-colors hover:text-muted"
          >
            <span className="eyebrow text-muted group-hover:text-ink">{etiqueta}</span>
            <span className="text-[0.9375rem] text-ink group-hover:text-muted">{valor}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
