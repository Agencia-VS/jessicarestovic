"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navActivo, type NavItem } from "@/lib/site-config";

/**
 * Enlace de la navegación: la sección activa queda en tinta plena con un
 * subrayado del acento; el resto, al 50% hasta que se pasa el cursor.
 *
 * Las fichas de trabajos indican su sección para conservar sus URLs públicas.
 */
export function NavEnlace({ href, label, seccionActiva }: NavItem & { seccionActiva?: string }) {
  const pathname = usePathname();

  const activo = navActivo(href, pathname, seccionActiva);

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
