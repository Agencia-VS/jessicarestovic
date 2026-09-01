import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const TAMANOS = {
  // 56px en escritorio / 40px en móvil, como el mockup.
  grande: "text-[2.5rem] md:text-[3.5rem]",
  chico: "text-[2rem]",
} as const;

interface WordmarkProps {
  tamano?: keyof typeof TAMANOS;
  /** Un `<h1>` cuando el nombre es el título de la página (Inicio). */
  comoTitulo?: boolean;
}

/**
 * La firma manuscrita de Jessica hace de logotipo. Se resuelve con tipografía
 * (Italianno) en vez de una imagen: escala sin perder nitidez y no suma peso.
 * Para usar su firma escaneada, reemplazar el `<span>` por un `next/image`.
 */
export function Wordmark({ tamano = "grande", comoTitulo = false }: WordmarkProps) {
  const Etiqueta = comoTitulo ? "h1" : "span";

  return (
    <Link href="/" className="shrink-0 transition-colors hover:text-muted" aria-label={`${siteConfig.nombre} — Inicio`}>
      <Etiqueta
        className={`block font-signature leading-[0.9] ${TAMANOS[tamano]}`}
      >
        {siteConfig.nombre}
      </Etiqueta>
    </Link>
  );
}
