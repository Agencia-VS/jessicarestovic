import { Header } from "./header";
import { Footer } from "./footer";

interface PaginaProps {
  children: React.ReactNode;
  /** El Inicio usa el nombre como `<h1>`. */
  comoTitulo?: boolean;
}

/**
 * Envoltura de todas las páginas públicas: cabecera, contenido y pie, con el
 * alto mínimo de pantalla para que el pie no suba en páginas cortas.
 */
export function Pagina({ children, comoTitulo = false }: PaginaProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <Header comoTitulo={comoTitulo} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}

interface EncabezadoProps {
  titulo: string;
  bajada?: string | null;
}

/** Encabezado de sección: el título de la página y una bajada opcional. */
export function Encabezado({ titulo, bajada }: EncabezadoProps) {
  return (
    <div className="gutter pt-14 pb-2 md:pt-18">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{titulo}</h1>
      {bajada && (
        <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-body text-pretty">
          {bajada}
        </p>
      )}
    </div>
  );
}
