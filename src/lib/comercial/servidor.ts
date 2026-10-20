import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as crearCliente } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado, supabaseEnv } from "@/lib/entorno";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { VERSION_PRIVACIDAD } from "./tipos";
import type { Database } from "@/types/database";

export function comercialConfigurado() {
  return supabaseConfigurado() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export function medicionHabilitada() {
  return comercialConfigurado() && (process.env.VERCEL_ENV === "production" || process.env.ENABLE_ANALYTICS_TEST === "true");
}
export function servicio() {
  if (!comercialConfigurado()) throw new Error("Módulo comercial sin configurar");
  return crearCliente<Database>(supabaseEnv().url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function hash(texto: string) {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!).update(texto).digest("hex");
}
export function firmar(valor: unknown) {
  const cuerpo = Buffer.from(JSON.stringify(valor)).toString("base64url");
  return cuerpo + "." + hash(cuerpo);
}
export function verificar(valor?: string): unknown {
  if (!valor || valor.length > 2000 || !comercialConfigurado()) return null;
  const [cuerpo, firma] = valor.split(".");
  if (!cuerpo || !firma || !/^[a-f0-9]{64}$/.test(firma)) return null;
  if (!timingSafeEqual(Buffer.from(hash(cuerpo)), Buffer.from(firma))) return null;
  try { return JSON.parse(Buffer.from(cuerpo, "base64url").toString()); } catch { return null; }
}
export const preferenciaSchema = z.object({ id: z.uuid(), aceptada: z.boolean(), version: z.string(), fecha: z.number() });
export const sesionSchema = z.object({ id: z.uuid(), vence: z.number(), origen: z.enum(["directo","instagram","google","facebook","bing","otro"]) });
export const opcionesCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export async function ingreso(request: Request, clase: string, max: number) {
  if (!comercialConfigurado()) return false;
  const origen = request.headers.get("origin");
  // Next puede reconstruir request.url con localhost detrás del proxy.
  if (!origen) return false;
  try {
    const url = new URL(origen);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origen || url.host !== request.headers.get("host")) return false;
  } catch { return false; }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return false;
  // Vercel sobrescribe este encabezado; en otros entornos el límite es global.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") ?? "sin-ip" : "local";
  const clave = hash(clase + ":" + new Date().toISOString().slice(0,10) + ":" + ip);
  const { data, error } = await servicio().rpc("permitir_ingreso", { p_clave: clave, p_max: max });
  return !error && data === true;
}
export async function leerJson(request: Request, limite = 4096): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > limite) throw new Error("Demasiados datos");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Falta contenido");
  let texto = ""; let bytes = 0; const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    bytes += value.length;
    if (bytes > limite) { await reader.cancel(); throw new Error("Demasiados datos"); }
    texto += decoder.decode(value, { stream: true });
  }
  return JSON.parse(texto + decoder.decode());
}
export async function adminComercial() {
  if (!supabaseConfigurado()) return null;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db.rpc("es_admin_comercial", {});
  return !error && data ? db : null;
}
export async function exigirAdminComercial() {
  const db = await adminComercial();
  if (!db) redirect("/admin?aviso=acceso-comercial");
  return db;
}
export async function preferenciaActual() {
  const pref = preferenciaSchema.safeParse(verificar((await cookies()).get("jr_preferencia")?.value));
  return pref.success && pref.data.version === VERSION_PRIVACIDAD && Date.now() - pref.data.fecha < 180 * 86400000 ? pref.data.aceptada : null;
}
