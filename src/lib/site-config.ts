import type { ConfiguracionContenido, ImagenPortada } from "@/types/database";

/**
 * Fuente única de verdad para los datos del sitio: identidad, navegación y
 * contacto. Todo lo que aparece en más de un lugar vive acá.
 */

/** Cuántas fotos forman el tríptico del Inicio. */
export const CELDAS_PORTADA = 3;

/**
 * El prefijo de los campos de una celda del tríptico. Lo comparten el
 * formulario del panel y la acción que guarda, así los nombres no se escriben
 * dos veces.
 */
export function campoPortada(indice: number): string {
  return `portada${indice + 1}`;
}

/**
 * Las fotos del Inicio tal como las lee el sitio, vengan del documento nuevo
 * o del anterior.
 *
 * Cuando la portada era una sola foto vivía en claves planas
 * (`portada_path`, `portada_alt`, …). Un documento guardado con esa forma se
 * lee como un tríptico de una sola foto, así que nadie pierde la portada que
 * ya subió y no hace falta migrar el JSON: la primera vez que se guarda desde
 * el panel, el documento queda con la forma nueva.
 */
export function normalizarPortadas(contenido: ConfiguracionContenido): ImagenPortada[] {
  if (Array.isArray(contenido.portadas) && contenido.portadas.length > 0) {
    return contenido.portadas.slice(0, CELDAS_PORTADA);
  }

  const antiguo = contenido as ConfiguracionContenido & {
    portada_path?: string | null;
    portada_alt?: string | null;
    portada_ancho?: number | null;
    portada_alto?: number | null;
  };
  if (!antiguo.portada_path) return [];

  return [
    {
      path: antiguo.portada_path,
      alt: antiguo.portada_alt ?? null,
      ancho: antiguo.portada_ancho ?? null,
      alto: antiguo.portada_alto ?? null,
    },
  ];
}

/**
 * Valores por defecto de la configuración editable. Se usan mientras no haya
 * base de datos conectada, y como respaldo si un campo quedara vacío.
 */
export const CONFIGURACION_POR_DEFECTO: ConfiguracionContenido = {
  email: "jessicarestoviclucic@gmail.com",
  telefono: "+56 9 8747 2258",
  instagram: "@jessica_restovic",
  cita:
    "Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.",
  portadas: [],
};

/**
 * Identidad del sitio. No incluye la URL a propósito: este módulo lo importan
 * componentes de cliente (la navegación), y leer una variable de entorno acá
 * la hornearía en el bundle del navegador. La URL vive en `entorno.ts`, que es
 * server-only, y se obtiene con `urlDelSitio()`.
 */
export const siteConfig = {
  nombre: "Jessica Restović",
  rol: "Artista visual",
  descripcion:
    "Obra de Jessica Restović, artista visual: grafito sobre tela, ensambles y volúmenes. Exposiciones y talleres.",
  locale: "es_CL",
  lang: "es",
} as const;

/** Los datos de contacto ya listos para pintar en la página. */
export interface Contacto {
  email: string;
  telefono: string;
  whatsappUrl: string;
  instagram: string;
  instagramUrl: string;
  cita: string;
}

/**
 * Deriva los enlaces a partir de lo que Jessica escribió: el de WhatsApp sale
 * de los dígitos del teléfono y el de Instagram, del usuario. Así ella
 * completa un campo por cosa y no una URL.
 */
export function derivarContacto(
  config: ConfiguracionContenido,
  mensajeWhatsapp?: string,
): Contacto {
  const digitos = config.telefono.replace(/\D/g, "");
  const usuario = config.instagram.replace(/^@+/, "");
  const wa = `https://wa.me/${digitos}`;

  return {
    email: config.email,
    telefono: config.telefono,
    whatsappUrl: mensajeWhatsapp ? `${wa}?text=${encodeURIComponent(mensajeWhatsapp)}` : wa,
    instagram: `@${usuario}`,
    instagramUrl: `https://www.instagram.com/${usuario}/`,
    cita: config.cita,
  };
}

export interface NavItem {
  href: string;
  label: string;
}

/**
 * Navegación pública.
 *
 * No hay índice general de obra: cada exposición es la puerta al cuerpo de
 * obra, que se organiza dentro de la trayectoria.
 */
export const navPublica: readonly NavItem[] = [
  { href: "/exposiciones", label: "Exposiciones" },
  { href: "/trabajos-recientes", label: "Trabajos recientes" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/clases", label: "Clases" },
  { href: "/contacto", label: "Contacto" },
] as const;

/**
 * Las páginas de obras viven bajo una exposición y en el menú marcan
 * «Exposiciones».
 */
/** Navegación del panel — las secciones del brief (§07). */
export const navAdmin: readonly NavItem[] = [
  { href: "/admin/inicio", label: "Inicio" },
  { href: "/admin/trabajos-recientes", label: "Trabajos recientes" },
  { href: "/admin/exposiciones", label: "Exposiciones" },
  { href: "/admin/sobre-mi", label: "Sobre mí" },
  { href: "/admin/clases", label: "Clases" },
  { href: "/admin/mensajes", label: "Mensajes" },
  { href: "/admin/configuracion", label: "Configuración" },
] as const;
