import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

/** Medidas de la firma en cada lugar donde aparece. */
const ALTOS = {
  // Cabecera: 34px en móvil, hasta 48px en escritorio.
  cabecera: "h-[clamp(2.125rem,3.4vw,3rem)]",
  pie: "h-6",
  panel: "h-8",
} as const;

interface FirmaProps {
  lugar?: keyof typeof ALTOS;
  /** El Inicio usa el nombre como `<h1>`; el resto de las páginas, no. */
  comoTitulo?: boolean;
  className?: string;
}

/**
 * La firma manuscrita de Jessica es el logotipo (§06): se conserva tal cual y
 * el resto de la tipografía se resuelve con familias neutras.
 *
 * Va en AVIF, que pesa una quinta parte, con un PNG transparente de respaldo
 * para los navegadores que no lo leen — de ahí el `<picture>` en vez de un
 * `next/image` suelto.
 */
export function Firma({ lugar = "cabecera", comoTitulo = false, className = "" }: FirmaProps) {
  const Etiqueta = comoTitulo ? "h1" : "span";
  const alt = `${siteConfig.nombre} — ${siteConfig.rol}`;

  return (
    <Etiqueta className={`block leading-none ${className}`}>
      <picture>
        <source srcSet="/firma-jessica.avif" type="image/avif" />
        <Image
          src="/firma-jessica.png"
          alt={alt}
          width={620}
          height={166}
          priority={lugar !== "pie"}
          unoptimized
          className={`${ALTOS[lugar]} w-auto`}
        />
      </picture>
    </Etiqueta>
  );
}

/** La firma como enlace al Inicio, que es lo que hace de marca en la cabecera. */
export function FirmaEnlace({ lugar = "cabecera", comoTitulo = false }: FirmaProps) {
  return (
    <Link href="/" className="block shrink-0" aria-label={`${siteConfig.nombre} — Inicio`}>
      <Firma lugar={lugar} comoTitulo={comoTitulo} />
    </Link>
  );
}
