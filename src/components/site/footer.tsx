import Link from "next/link";
import { siteConfig, type Contacto } from "@/lib/site-config";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { Firma } from "./firma";

/**
 * Pie del sitio: la firma apagada y los enlaces mínimos. Cierra sin repetir
 * el menú —está fijo arriba— y suma lo que el sitio en Wix no tenía: un enlace
 * a la política de privacidad (§03).
 */
export function Footer({ contacto }: { contacto: Contacto }) {
  return (
    <footer className="border-t border-line">
      <div className="marco gutter flex flex-wrap items-baseline justify-between gap-4.5 py-[clamp(1.625rem,3.2vw,2.75rem)]">
        <Firma lugar="pie" className="opacity-55" />

        <div className="flex flex-wrap items-baseline gap-x-[clamp(0.875rem,2.2vw,2rem)] gap-y-2">
          <a
            href={`mailto:${contacto.email}`}
            className="eyebrow tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Email
          </a>
          <a
            href={contacto.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Instagram
          </a>
          <Link
            href="/privacidad"
            className="eyebrow tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Privacidad
          </Link>
          <span className="eyebrow tracking-[0.14em] text-label">
            © {new Date().getFullYear()} {siteConfig.nombre}
          </span>
        </div>
      </div>

      {/* Mientras no haya base de datos, lo que se ve son bloques de
          referencia. Decirlo evita que se confundan con su obra. */}
      {!supabaseConfigurado() && (
        <div className="marco gutter pb-8">
          <p className="ficha text-label">
            Vista de diseño: las imágenes son bloques de color de referencia, no obra de la artista.
          </p>
        </div>
      )}
    </footer>
  );
}
