"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navAdmin } from "@/lib/site-config";

interface NavAdminProps {
  sinLeer: number;
}

/**
 * Navegación del panel. En móvil es una fila que se desplaza, para que el
 * panel se pueda usar de punta a punta desde el celular (§07).
 */
export function NavAdmin({ sinLeer }: NavAdminProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 whitespace-nowrap md:flex-col md:gap-0.5">
        {navAdmin.map(({ href, label }) => {
          const activo = pathname === href || pathname.startsWith(`${href}/`);
          const esMensajes = href === "/admin/mensajes";

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  activo ? "bg-line-soft text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {label}
                {esMensajes && sinLeer > 0 && (
                  <span
                    className="caption min-w-5 rounded-full bg-ink px-1.5 text-center text-paper"
                    aria-label={`${sinLeer} sin leer`}
                  >
                    {sinLeer}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
