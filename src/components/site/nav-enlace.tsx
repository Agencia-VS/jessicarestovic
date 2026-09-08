"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site-config";

/**
 * Enlace de la navegación: la sección activa queda en tinta plena con un
 * subrayado del acento; el resto, al 50% hasta que se pasa el cursor.
 *
 * El segundo nivel de obras vive bajo «Exposiciones», por lo que la ruta
 * anidada conserva automáticamente la sección activa.
 */
export function NavEnlace({ href, label }: NavItem) {
  const pathname = usePathname();

  const enSeccion = pathname === href || pathname.startsWith(`${href}/`);
  const activo = enSeccion;

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
