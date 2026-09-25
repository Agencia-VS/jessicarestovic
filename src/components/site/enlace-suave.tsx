import Link from "next/link";

/**
 * El enlace suelto del diseño: versalitas espaciadas sobre una línea tenue que
 * pasa al acento en hover. Es el mismo gesto en «Ver exposiciones» y en los
 * enlaces de Sobre mí.
 */
export function EnlaceSuave({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="eyebrow self-start border-b border-rule-soft pb-1 transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}
