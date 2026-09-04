import Link from "next/link";
import { navPublica, siteConfig, type Contacto } from "@/lib/site-config";
import { supabaseConfigurado } from "@/lib/supabase/env";

/**
 * Pie del sitio. Cierra con los dos canales que Jessica usa de verdad —
 * WhatsApp y correo (§12: «alcanza con WhatsApp y email»)— más Instagram,
 * que es de donde llega buena parte de su público.
 */
export function Footer({ contacto }: { contacto: Contacto }) {
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
            href={contacto.whatsappUrl}
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

      {/* Mientras no haya base de datos, lo que se ve son bloques de
          referencia. Decirlo evita que se confundan con su obra. */}
      {!supabaseConfigurado() && (
        <p className="caption mt-2 text-faint">
          Vista de diseño: las imágenes son bloques de color de referencia, no obra de la artista.
        </p>
      )}
    </footer>
  );
}
