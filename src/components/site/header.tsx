import { navPublica, type Contacto } from "@/lib/site-config";
import { NavEnlace } from "./nav-enlace";
import { MenuMovil } from "./menu-movil";
import { SubindiceMovil } from "./subindice-movil";

/**
 * El desplegable de una sección en el teléfono: las muestras de
 * «Exposiciones» o los conjuntos de «Trabajos».
 */
export interface Subindice {
  /** Cómo se lee en la cabecera: «Exposiciones», «Trabajos». */
  seccion: string;
  /** El índice de la sección, que es también la opción que muestra todo. */
  base: string;
  /** Cómo se llama esa opción: «Todas», «Todos». */
  todos: string;
  grupos: { slug: string; titulo: string }[];
  /** El grupo abierto, o `null` en el índice. */
  activo: string | null;
}

/**
 * Cabecera del sitio, fija arriba con el fondo apenas translúcido: la obra
 * pasa por debajo sin que el menú se pierda.
 *
 * En escritorio es solo la navegación, alineada a la izquierda del canvas. La
 * firma manuscrita estaba acá y salió a pedido de Jessica; se queda en el pie.
 * Con ella se fue el único enlace al Inicio, así que «Inicio» es la primera
 * pestaña.
 *
 * En el teléfono la navegación se recoge detrás de un «+» de trazo fino —más
 * de galería que de aplicación—, porque cinco enlaces en versalitas ocupaban
 * dos líneas antes de la primera foto. A la izquierda queda lo que sirve
 * dentro de una sección: el desplegable para saltar a otra muestra o a otro
 * conjunto. En las demás páginas, solo el «+».
 */
export function Header({ contacto, subindice }: { contacto: Contacto; subindice?: Subindice }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-lg">
      <div className="marco gutter hidden py-[clamp(0.875rem,1.8vw,1.25rem)] lg:block">
        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-baseline gap-x-[clamp(0.875rem,2vw,2rem)] gap-y-2"
        >
          {navPublica.map((item) => (
            <NavEnlace key={item.href} {...item} />
          ))}
        </nav>
      </div>

      <div className="gutter relative flex h-14 items-center justify-between lg:hidden">
        {subindice ? (
          <SubindiceMovil
            // Al pasar a otro grupo el desplegable se vuelve a montar cerrado.
            key={subindice.activo ?? ""}
            seccion={subindice.seccion}
            base={subindice.base}
            todos={subindice.todos}
            // Solo lo que el desplegable dibuja: los grupos completos traen
            // todas sus fotos, y viajarían enteros al navegador.
            grupos={subindice.grupos.map(({ slug, titulo }) => ({ slug, titulo }))}
            activo={subindice.activo}
          />
        ) : (
          <span />
        )}
        <MenuMovil email={contacto.email} instagramUrl={contacto.instagramUrl} />
      </div>
    </header>
  );
}
