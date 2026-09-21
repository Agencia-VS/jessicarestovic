import { Header } from "./header";
import { Footer } from "./footer";
import { obtenerConfiguracion } from "@/lib/data/consultas";
import { derivarContacto } from "@/lib/site-config";

interface PaginaProps {
  children: React.ReactNode;
}

/**
 * Envoltura de todas las páginas públicas: cabecera, contenido y pie, con el
 * alto mínimo de pantalla para que el pie no suba en páginas cortas.
 */
export async function Pagina({ children }: PaginaProps) {
  const contacto = derivarContacto(await obtenerConfiguracion());

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer contacto={contacto} />
    </div>
  );
}

/**
 * El título de una página con contenido propio: Contacto, Privacidad, el 404.
 *
 * Bajó de `clamp(2.125rem, 4.6vw, 4rem)` —hasta 64px, un cartel— a la medida
 * del título de una muestra. Lo que Jessica pidió retirar fue el nombre de
 * sección repetido en enorme, no el encabezado de una página que sí necesita
 * decir de qué trata.
 */
export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-tight font-light -tracking-[0.01em]">
      {children}
    </h1>
  );
}

interface SeccionProps {
  titulo: string;
  /** El conteo que va a la derecha del título: «7 exposiciones». */
  conteo?: string;
  /** Permite que la etiqueta de sección no compita con el título principal. */
  tituloComo?: "h1" | "p";
  children: React.ReactNode;
}

/**
 * Una sección: el conteo a la derecha y una línea que separa del contenido.
 *
 * El nombre de la sección ya no se dibuja. Estaba en un serif enorme —«Trabajos»
 * ocupando cuatro centímetros de pantalla— y Jessica pidió limpiar ese espacio:
 * la pestaña activa del menú ya dice dónde está uno, así que el título grande
 * repetía sin aportar.
 *
 * Sigue existiendo para quien no ve la pantalla. Cuando la sección es el
 * encabezado de la página va como `<h1>` oculto a la vista —buscadores y
 * lectores de pantalla lo necesitan— y cuando el `<h1>` real está más abajo,
 * como en la ficha de una muestra, no se dibuja nada: un `<p>` invisible sería
 * ruido para el lector de pantalla y nada para el resto.
 */
export function Seccion({ titulo, conteo, tituloComo = "h1", children }: SeccionProps) {
  return (
    <div className="marco gutter pt-[clamp(1.5rem,3.2vw,2.75rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
      {tituloComo === "h1" && <h1 className="sr-only">{titulo}</h1>}
      {conteo && (
        <div className="flex flex-wrap items-baseline justify-end gap-6 pb-[clamp(1rem,2vw,1.625rem)]">
          <span className="eyebrow text-faint">{conteo}</span>
        </div>
      )}
      {children}
    </div>
  );
}
