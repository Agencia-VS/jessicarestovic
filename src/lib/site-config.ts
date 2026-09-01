/**
 * Fuente única de verdad para los datos del sitio: identidad, navegación y
 * contacto. Todo lo que aparece en más de un lugar vive acá.
 */

/** Número de WhatsApp en formato internacional, solo dígitos (para wa.me). */
const WHATSAPP_E164 = "56987472258";

export const siteConfig = {
  nombre: "Jessica Restović",
  rol: "Artista visual",
  descripcion:
    "Obra de Jessica Restović, artista visual: series en grafito sobre tela, ensambles y volúmenes. Galería, exposiciones y talleres.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jessicarestovic.com",
  locale: "es_CL",
  lang: "es",
  cita:
    "Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.",
  contacto: {
    email: "jessicarestoviclucic@gmail.com",
    telefono: "+56 9 8747 2258",
    whatsapp: WHATSAPP_E164,
    whatsappUrl: `https://wa.me/${WHATSAPP_E164}`,
    instagram: "@jessica_restovic",
    instagramUrl: "https://www.instagram.com/jessica_restovic/",
  },
} as const;

/** Mensaje precargado al abrir WhatsApp desde el sitio. */
export function whatsappUrl(mensaje?: string): string {
  const base = siteConfig.contacto.whatsappUrl;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export interface NavItem {
  href: string;
  label: string;
}

/** Navegación pública — el mapa de páginas del brief (§05). */
export const navPublica: readonly NavItem[] = [
  { href: "/obra", label: "Obra" },
  { href: "/exposiciones", label: "Exposiciones" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/clases", label: "Clases" },
  { href: "/contacto", label: "Contacto" },
] as const;

/** Navegación del panel — las secciones del brief (§07). */
export const navAdmin: readonly NavItem[] = [
  { href: "/admin/obras", label: "Obras" },
  { href: "/admin/series", label: "Series" },
  { href: "/admin/exposiciones", label: "Exposiciones" },
  { href: "/admin/sobre-mi", label: "Sobre mí" },
  { href: "/admin/clases", label: "Clases" },
  { href: "/admin/mensajes", label: "Mensajes" },
] as const;
