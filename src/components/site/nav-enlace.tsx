"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCION_DE_SERIE, type NavItem } from "@/lib/site-config";

/**
 * Enlace de la navegación: la sección activa queda en tinta plena con un
 * subrayado del acento; el resto, al 50% hasta que se pasa el cursor.
 *
 * Una página de serie marca «Exposiciones»: es de donde se entró, y así el
 * visitante no siente que se salió del sitio.
 */
export function NavEnlace({ href, label }: NavItem) {
  const pathname = usePathname();

  const enSeccion = pathname === href || pathname.startsWith(`${href}/`);
  const desdeSerie = href === SECCION_DE_SERIE && pathname.startsWith("/serie/");
  const activo = enSeccion || desdeSerie;

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`eyebrow border-b pb-[3px] transition-opacity hover:opacity-100 ${
        activo ? "border-accent opacity-100" : "border-transparent opacity-50"
      }`}
    >
      {label}
    </Link>
  );
}
