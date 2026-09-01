"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { navPublica } from "@/lib/site-config";

/**
 * Menú de móvil. El botón son las dos líneas del mockup; abierto, ocupa la
 * pantalla completa con los enlaces en grande.
 */
export function NavMovil() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Cerrar al navegar.
  useEffect(() => setAbierto(false), [pathname]);

  // Cerrar con Escape y bloquear el scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPresionar);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-controls={panelId}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        className="flex size-12 items-center justify-end text-ink"
      >
        {abierto ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.2" />
            <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ) : (
          <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true">
            <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.2" />
            <line x1="0" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>

      {abierto && (
        <div
          id={panelId}
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-1 bg-paper px-6 pt-6"
        >
          {navPublica.map(({ href, label }) => {
            const activo = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`border-b border-line-soft py-4 font-display text-3xl ${
                  activo ? "text-ink" : "text-inactive"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
