export const VERSION_PRIVACIDAD = "2026-10-20";
export const MOTIVOS = { obra: "Consultar por una obra", precio: "Disponibilidad y precio", colaboracion: "Exposición o colaboración", otra: "Otra consulta" } as const;
export type Motivo = keyof typeof MOTIVOS;
export type Evento = "pagina" | "whatsapp" | "email" | "instagram" | "contacto";
export type Origen = "directo" | "instagram" | "google" | "facebook" | "bing" | "otro";
export type Dispositivo = "movil" | "tablet" | "computador";
export type Estado = "nuevo" | "contactado" | "conversacion" | "cerrado";
export type Lead = { id: string; nombre: string; email: string; motivo: Motivo; grupo_id: string | null; novedades: boolean; estado: Estado; baja_hash: string; creado_en: string; actualizado_en: string };
export type EventoRow = { id: string; sesion_id: string; consentimiento_id: string; evento: Evento; ruta: string; origen: Origen; dispositivo: Dispositivo; creado_en: string };
export type Consentimiento = { id: string; contacto_id: string; finalidad: string; otorgado: boolean; version: string; creado_en: string };
export type Periodo = { periodo: string; vistas: number; sesiones: number; conversiones: number; whatsapp: number; email: number; instagram: number };
export type Resumen = {
  periodos: Periodo[];
  dias: { dia: string; vistas: number; sesiones: number }[];
  paginas: { ruta: string; vistas: number }[];
  fuentes: { origen: string; sesiones: number }[];
  dispositivos: { dispositivo: string; sesiones: number }[];
  contactos: number; contactos_anteriores: number;
};
