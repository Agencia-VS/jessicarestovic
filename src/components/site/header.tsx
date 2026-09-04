import { navPublica } from "@/lib/site-config";
import { FirmaEnlace } from "./firma";
import { NavEnlace } from "./nav-enlace";

interface HeaderProps {
  /** El Inicio usa el nombre como `<h1>`; el resto de las páginas, no. */
  comoTitulo?: boolean;
}

/**
 * Cabecera del sitio: la firma a la izquierda y la navegación alineada a su
 * base. Queda fija arriba con el fondo apenas translúcido, así la obra pasa
 * por debajo sin que el menú se pierda.
 *
 * No hay menú hamburguesa: cinco enlaces en versalitas de 11px caben y, si no,
 * bajan de línea. Un botón que abre una capa sería más interfaz visible de la
 * que el sitio necesita.
 */
export function Header({ comoTitulo = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-lg">
      <div className="marco gutter flex flex-wrap items-baseline justify-between gap-x-[clamp(1.125rem,4vw,3.75rem)] gap-y-3 py-[clamp(1rem,2.4vw,1.625rem)]">
        <FirmaEnlace comoTitulo={comoTitulo} />

        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-baseline gap-x-[clamp(0.875rem,2vw,2rem)] gap-y-2"
        >
          {navPublica.map((item) => (
            <NavEnlace key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </header>
  );
}
