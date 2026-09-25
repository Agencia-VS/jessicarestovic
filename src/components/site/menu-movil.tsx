"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navPublica } from "@/lib/site-config";

/**
 * El menú del teléfono: un «+» de trazo fino que abre la navegación a
 * pantalla completa, con las secciones en letra grande y liviana. Se cierra
 * con la misma cruz, girada.
 *
 * Es un `<dialog>` modal del navegador y no una capa hecha a mano, por tres
 * cosas que así vienen resueltas: el foco queda atrapado adentro mientras está
 * abierto, Escape lo cierra, y al cerrarse el foco vuelve al «+». Además se
 * dibuja por encima de todo aunque la cabecera tenga `backdrop-filter`, que a
 * una capa `fixed` común la dejaría encerrada dentro de la cabecera.
 */
export function MenuMovil({ email, instagramUrl }: { email: string; instagramUrl: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Si se navega con el menú abierto —el «atrás» del teléfono—, se cierra.
  useEffect(() => {
    dialogo.current?.close();
  }, [pathname]);

  // Si se desmonta abierto, no deja la página sin poder desplazarse.
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );

  const abrir = () => {
    dialogo.current?.showModal();
    // El diálogo pone el foco en su primer botón, la cruz, y el anillo de
    // foco la dibujaba enmarcada aunque se hubiera abierto con el dedo. El
    // foco va al panel entero: el lector de pantalla lo anuncia como «Menú»
    // y con el teclado la primera tabulación llega a la cruz, ahí sí visible.
    dialogo.current?.focus();
    document.body.style.overflow = "hidden";
    setAbierto(true);
  };

  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-label="Menú"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        className="-mr-3 flex size-11 items-center justify-center text-ink"
      >
        <Cruz />
      </button>

      <dialog
        ref={dialogo}
        id="menu-movil"
        aria-label="Menú"
        tabIndex={-1}
        onClose={() => {
          document.body.style.overflow = "";
          setAbierto(false);
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none overscroll-contain border-0 bg-paper p-0 text-ink outline-none backdrop:bg-transparent"
      >
        <div className="flex h-full flex-col">
          <div className="gutter flex h-14 shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar menú"
              className="-mr-3 flex size-11 items-center justify-center"
            >
              <Cruz girada />
            </button>
          </div>

          <nav aria-label="Navegación principal" className="gutter flex flex-col gap-1.5 pt-12">
            {navPublica.map(({ href, label }) => {
              // Igual que en la cabecera de escritorio: el Inicio solo en su
              // propia dirección; una sección, también en sus páginas internas.
              const activo = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={cerrar}
                  aria-current={activo ? "page" : undefined}
                  className={`flex min-h-13 items-center text-[2rem] leading-tight font-extralight -tracking-[0.01em] ${
                    activo ? "text-ink" : "text-muted"
                  }`}
                >
                  <span className={activo ? "border-b border-accent pb-0.5" : undefined}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="gutter mt-auto flex flex-wrap gap-x-6 gap-y-2 pb-9">
            <a
              href={`mailto:${email}`}
              className="eyebrow tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              Email
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow tracking-[0.14em] text-muted transition-colors hover:text-ink"
            >
              Instagram
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Una cruz de trazo fino: «+» para abrir, girada 45° para cerrar. */
function Cruz({ girada = false }: { girada?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={girada ? "rotate-45" : undefined}
    >
      <path d="M9 1v16M1 9h16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
