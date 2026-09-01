import Link from "next/link";
import { navPublica, siteConfig, whatsappUrl } from "@/lib/site-config";

const { contacto } = siteConfig;

/**
 * Pie del sitio. Cierra con los dos canales que Jessica usa de verdad —
 * WhatsApp y correo (§12: «alcanza con WhatsApp y email»)— más Instagram,
 * que es de donde llega buena parte de su público.
 */
export function Footer() {
  return (
    <footer className="gutter mt-24 border-t border-line pt-10 pb-16">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="font-signature text-4xl leading-[0.9]">{siteConfig.nombre}</span>
          <span className="eyebrow text-muted">{siteConfig.rol}</span>
        </div>

        <nav aria-label="Secciones" className="flex flex-col gap-2">
          {navPublica.map(({ href, label }) => (
            <Link key={href} href={href} className="caption text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <a
            href={whatsappUrl(`Hola Jessica, te escribo desde tu sitio.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="caption text-muted transition-colors hover:text-ink"
          >
            WhatsApp {contacto.telefono}
          </a>
          <a
            href={`mailto:${contacto.email}`}
            className="caption text-muted transition-colors hover:text-ink"
          >
            {contacto.email}
          </a>
          <a
            href={contacto.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="caption text-muted transition-colors hover:text-ink"
          >
            Instagram {contacto.instagram}
          </a>
        </div>
      </div>

      <p className="caption mt-12 text-faint">
        © {new Date().getFullYear()} {siteConfig.nombre}. Todas las obras reproducidas en este sitio
        son de su autoría.
      </p>
    </footer>
  );
}
