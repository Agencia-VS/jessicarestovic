import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { servicio, verificar, preferenciaSchema, sesionSchema, firmar, opcionesCookie, medicionHabilitada } from "./servidor";
import { VERSION_PRIVACIDAD, type Evento } from "./tipos";

export const eventoSchema = z.object({
  id: z.uuid(), evento: z.enum(["pagina", "whatsapp", "email", "instagram"]),
  ruta: z.string().max(180),
  origen: z.enum(["directo","instagram","google","facebook","bing","otro"]),
  dispositivo: z.enum(["movil","tablet","computador"]),
}).strict();

export async function rutaPublica(ruta: string) {
  if (["/", "/exposiciones", "/trabajos", "/sobre-mi", "/contacto", "/privacidad"].includes(ruta)) return true;
  const detalle = /^\/(exposiciones|trabajos)\/([a-z0-9-]{1,150})$/.exec(ruta);
  if (!detalle) return false;
  const { data } = await servicio().from("exposicion").select("id").eq("slug", detalle[2]!).eq("tipo", detalle[1] === "trabajos" ? "trabajo" : "exposicion").eq("publicada", true).maybeSingle();
  return Boolean(data);
}
export async function registrarEvento(entrada: z.infer<typeof eventoSchema>, evento: Evento = entrada.evento) {
  if (!medicionHabilitada() || !await rutaPublica(entrada.ruta)) return;
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (user) return;
  const jar = await cookies();
  const pref = preferenciaSchema.safeParse(verificar(jar.get("jr_preferencia")?.value));
  if (!pref.success || !pref.data.aceptada || pref.data.version !== VERSION_PRIVACIDAD || Date.now() - pref.data.fecha > 180 * 86400000) return;
  const { data } = await servicio().from("preferencia_analitica").select("aceptada").eq("id", pref.data.id).maybeSingle();
  if (!data?.aceptada) return;
  const anterior = sesionSchema.safeParse(verificar(jar.get("jr_sesion")?.value));
  const sesion = anterior.success && anterior.data.vence > Date.now() ? anterior.data : { id: randomUUID(), origen: entrada.origen, vence: 0 };
  sesion.vence = Date.now() + 30 * 60000;
  const { error } = await servicio().from("evento_web").upsert({
    id: entrada.id, evento, ruta: entrada.ruta, sesion_id: sesion.id,
    consentimiento_id: pref.data.id, origen: sesion.origen, dispositivo: entrada.dispositivo,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  jar.set("jr_sesion", firmar(sesion), { ...opcionesCookie, maxAge: 1800 });
}
