import { Header } from "./header";
import { Footer } from "./footer";
import { obtenerConfiguracion } from "@/lib/data/consultas";
import { derivarContacto } from "@/lib/site-config";

interface PaginaProps {
  children: React.ReactNode;
  /** El Inicio usa el nombre como `<h1>`. */
  comoTitulo?: boolean;
}

/**
 * Envoltura de todas las páginas públicas: cabecera, contenido y pie, con el
 * alto mínimo de pantalla para que el pie no suba en páginas cortas.
 */
export async function Pagina({ children, comoTitulo = false }: PaginaProps) {
  const contacto = derivarContacto(await obtenerConfiguracion());

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <Header comoTitulo={comoTitulo} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer contacto={contacto} />
    </div>
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
 * Una sección con título: el nombre a la izquierda en serif grande, el conteo
 * alineado a su base a la derecha, y una línea que separa del contenido.
 */
export function Seccion({ titulo, conteo, tituloComo = "h1", children }: SeccionProps) {
  return (
    <div className="marco gutter pt-[clamp(2.5rem,5.5vw,5.375rem)] pb-[clamp(3.5rem,7vw,6.875rem)]">
      <div className="flex flex-wrap items-baseline justify-between gap-6 pb-[clamp(1.625rem,3.4vw,2.875rem)]">
        <Titulo como={tituloComo}>{titulo}</Titulo>
        {conteo && <span className="eyebrow text-faint">{conteo}</span>}
      </div>
      {children}
    </div>
  );
}

/** El título de una página: serif editorial, liviano y muy grande. */
export function Titulo({
  children,
  como = "h1",
}: {
  children: React.ReactNode;
  como?: "h1" | "p";
}) {
  const className =
    "font-display text-[clamp(2.125rem,4.6vw,4rem)] leading-none font-light -tracking-[0.02em]";
  return como === "h1" ? (
    <h1 className={className}>{children}</h1>
  ) : (
    <p className={className}>{children}</p>
  );
}
