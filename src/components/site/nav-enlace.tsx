"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/site-config";

/** Enlace de la navegación: activo en tinta, el resto apagado. */
export function NavEnlace({ href, label }: NavItem) {
  const pathname = usePathname();
  const activo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`eyebrow transition-colors ${activo ? "text-ink" : "text-muted hover:text-ink"}`}
    >
      {label}
    </Link>
  );
}
