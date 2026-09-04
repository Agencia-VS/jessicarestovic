import { z } from "zod";

/** Mensajes de error en lenguaje simple, sin vocabulario técnico (§07). */

const texto = (max: number) => z.string().trim().max(max, `Se pasó del largo máximo (${max}).`);

export const mensajeSchema = z.object({
  nombre: texto(120).min(2, "Escribe tu nombre."),
  email: texto(200).pipe(z.string().email("Revisa el correo: parece incompleto.")),
  telefono: texto(40).optional().or(z.literal("")),
  mensaje: texto(4000).min(10, "Cuéntame un poco más, con al menos diez caracteres."),
  origen: z.enum(["contacto", "clases"]),
});

export type MensajeEntrada = z.infer<typeof mensajeSchema>;

export const serieSchema = z.object({
  nombre: texto(120).min(2, "La serie necesita un nombre."),
  descripcion: texto(600).optional().or(z.literal("")),
  orden: z.coerce.number().int().min(0).default(0),
});

export const obraSchema = z.object({
  titulo: texto(200).min(1, "La obra necesita un título."),
  serie_id: z.string().uuid().nullable().optional(),
  anio: z.coerce
    .number()
    .int()
    .min(1900, "Revisa el año.")
    .max(2100, "Revisa el año.")
    .nullable()
    .optional(),
  tecnica: texto(160).optional().or(z.literal("")),
  dimensiones: texto(160).optional().or(z.literal("")),
  imagen_alt: texto(300).min(4, "Describe la foto en pocas palabras: mejora el buscador y la accesibilidad."),
  destacada: z.coerce.boolean().default(false),
  publicada: z.coerce.boolean().default(true),
  orden: z.coerce.number().int().min(0).default(0),
});

export const exposicionSchema = z.object({
  titulo: texto(200).min(1, "La exposición necesita un título."),
  lugar: texto(200).optional().or(z.literal("")),
  anio: z.coerce
    .number()
    .int()
    .min(1900, "Revisa el año.")
    .max(2100, "Revisa el año.")
    .nullable()
    .optional(),
  descripcion: texto(2000).optional().or(z.literal("")),
  publicada: z.coerce.boolean().default(true),
  orden: z.coerce.number().int().min(0).default(0),
});

export const sobreMiSchema = z.object({
  titulo: texto(120).min(1, "El título no puede quedar vacío."),
  biografia: texto(6000).min(1, "Escribe la biografía."),
  cita: texto(400).optional().or(z.literal("")),
  retrato_alt: texto(300).optional().or(z.literal("")),
});

export const configuracionSchema = z.object({
  email: texto(200).pipe(z.string().email("Revisa el correo: parece incompleto.")),
  telefono: texto(40).min(8, "Escribe el teléfono con su código de país."),
  instagram: texto(60).min(2, "Escribe tu usuario de Instagram."),
  cita: texto(400).min(1, "La frase de portada no puede quedar vacía."),
});

export const clasesSchema = z.object({
  titulo: texto(120).min(1, "El título no puede quedar vacío."),
  introduccion: texto(3000).min(1, "Escribe la presentación de los talleres."),
  /** Una técnica por línea en el formulario. */
  tecnicas: texto(1200).optional().or(z.literal("")),
  nota: texto(400).optional().or(z.literal("")),
});

/**
 * Convierte los errores de Zod en un mapa `campo -> mensaje`, que es lo que
 * los formularios muestran bajo cada campo.
 */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "_";
    errores[campo] ??= issue.message;
  }
  return errores;
}

/** Genera un slug legible a partir de un nombre. */
export function slugify(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
