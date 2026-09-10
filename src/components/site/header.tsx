import { navPublica } from "@/lib/site-config";
import { FirmaEnlace } from "./firma";
import { NavEnlace } from "./nav-enlace";

interface HeaderProps {
  /** El Inicio usa el nombre como `<h1>`; el resto de las páginas, no. */
  comoTitulo?: boolean;
}

/**
 * Cabecera del sitio: la firma a la izquierda y la navegación centrada contra
 * ella. Queda fija arriba con el fondo apenas translúcido, así la obra pasa
 * por debajo sin que el menú se pierda.
 *
 * Se centra, no se alinea a la base. Con `items-baseline` el borde inferior de
 * la firma se pegaba a la línea base de los enlaces, y como la firma es mucho
 * más alta que una línea de texto quedaba flotando 22px por encima del centro
 * de las pestañas: la firma arriba, el menú hundido. El centrado los cruza por
 * la mitad, que es lo que el ojo espera de dos bloques de distinto alto.
 *
 * El trazo del logotipo está centrado dentro de su PNG (desvío del 2,7%), así
 * que el centrado geométrico basta y no hay que compensar a mano.
 *
 * No hay menú hamburguesa: cinco enlaces en versalitas de 11px caben y, si no,
 * bajan de línea. Un botón que abre una capa sería más interfaz visible de la
 * que el sitio necesita.
 */
export function Header({ comoTitulo = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-lg">
      <div className="marco gutter flex flex-wrap items-center justify-between gap-x-[clamp(1.125rem,4vw,3.75rem)] gap-y-3 py-[clamp(0.75rem,1.6vw,1.125rem)]">
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
