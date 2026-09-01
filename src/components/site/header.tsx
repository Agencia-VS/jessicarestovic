import { navPublica } from "@/lib/site-config";
import { Wordmark } from "./wordmark";
import { NavMovil } from "./nav-movil";
import { NavEnlace } from "./nav-enlace";

interface HeaderProps {
  /** El Inicio usa el nombre como `<h1>`; el resto de las páginas, no. */
  comoTitulo?: boolean;
}

/**
 * Cabecera del sitio: la firma a la izquierda, la navegación alineada a la
 * base — como en el mockup, 52px de aire arriba.
 */
export function Header({ comoTitulo = false }: HeaderProps) {
  return (
    <header className="gutter flex h-16 items-center justify-between md:h-auto md:items-end md:pt-13">
      <Wordmark comoTitulo={comoTitulo} />

      <nav aria-label="Navegación principal" className="hidden gap-8.5 pb-2 md:flex">
        {navPublica.map((item) => (
          <NavEnlace key={item.href} {...item} />
        ))}
      </nav>

      <NavMovil />
    </header>
  );
}
