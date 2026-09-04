import Link from "next/link";
import { NavAdmin } from "@/components/admin/nav-admin";
import { BotonSalir } from "@/components/admin/boton-salir";
import { contarMensajesSinLeer } from "@/lib/data/consultas";
import { Firma } from "@/components/site/firma";
import { siteConfig } from "@/lib/site-config";

/**
 * El panel nunca se cachea: siempre refleja el estado real del contenido y
 * depende de la sesión de quien entra.
 */
export const dynamic = "force-dynamic";

/**
 * Marco del panel: la firma, la navegación y el contenido. La pantalla de
 * acceso queda fuera de este grupo, así que no hereda la navegación.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sinLeer = await contarMensajesSinLeer();

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row md:gap-14 md:px-10 md:py-12">
        <div className="flex shrink-0 flex-col gap-7 md:w-44">
          <div className="flex items-baseline justify-between gap-4 md:flex-col md:items-start md:gap-1">
            <Link href="/admin/obras" aria-label={`${siteConfig.nombre} — Panel`}>
              <Firma lugar="panel" />
            </Link>
            <BotonSalir />
          </div>

          <NavAdmin sinLeer={sinLeer} />

          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="caption hidden text-muted underline underline-offset-4 transition-colors hover:text-ink md:block"
          >
            Ver el sitio
          </Link>
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
