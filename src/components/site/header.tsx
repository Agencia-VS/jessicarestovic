import { navPublica } from "@/lib/site-config";
import { NavEnlace } from "./nav-enlace";

/**
 * Cabecera del sitio: solo la navegación, alineada a la izquierda del canvas.
 *
 * La firma manuscrita estaba acá y salió a pedido de Jessica; se queda en el
 * pie. Con ella se fue el único enlace al Inicio, así que «Inicio» pasa a ser
 * la primera pestaña: sin eso la portada no tenía cómo alcanzarse desde el
 * menú. También se fue el `<h1>` que la firma aportaba en el Inicio, que ahora
 * vive en esa página.
 *
 * Queda fija arriba con el fondo apenas translúcido, así la obra pasa por
 * debajo sin que el menú se pierda.
 *
 * No hay menú hamburguesa: los enlaces en versalitas de 11px caben y, si no,
 * bajan de línea. Un botón que abre una capa sería más interfaz visible de la
 * que el sitio necesita.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-lg">
      <div className="marco gutter py-[clamp(0.875rem,1.8vw,1.25rem)]">
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
