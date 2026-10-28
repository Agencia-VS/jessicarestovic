import { NextResponse } from "next/server";
import { z } from "zod";
import { ingreso, leerJson, servicio, hash, medicionHabilitada } from "@/lib/comercial/servidor";
import { registrarEvento, eventoSchema } from "@/lib/comercial/eventos-servidor";
import { VERSION_PRIVACIDAD } from "@/lib/comercial/tipos";
const schema = z.object({
  id: z.uuid(), nombre: z.string().trim().min(2).max(100), email: z.email().max(254).transform((v) => v.toLowerCase()),
  motivo: z.enum(["obra","precio","colaboracion","otra"]), grupo: z.uuid().nullable(),
  guardar: z.literal(true), novedades: z.boolean(), empresa: z.literal(""),
  evento: eventoSchema.optional(),
}).strict();
export async function POST(request: Request) {
  try {
    if (!medicionHabilitada()) return NextResponse.json({ error: "El registro está desactivado en esta versión. Continúa por WhatsApp." }, { status:503 });
    if (!await ingreso(request, "contactos", 20)) return NextResponse.json({ error: "No pudimos registrar tus datos ahora. Puedes continuar directamente en WhatsApp." }, { status: 429 });
    const d = schema.parse(await leerJson(request));
    if (d.grupo) {
      const { data } = await servicio().from("exposicion").select("id").eq("id", d.grupo).eq("publicada", true).maybeSingle();
      if (!data) throw new Error("Grupo inválido");
    }
    const token = hash("baja:" + d.id);
    const { data: creado, error } = await servicio().rpc("registrar_contacto", {
      p_id:d.id, p_nombre:d.nombre, p_email:d.email, p_motivo:d.motivo, p_grupo:d.grupo,
      p_novedades:d.novedades, p_baja_hash:hash(token), p_version:VERSION_PRIVACIDAD,
    });
    if (error) throw error;
    if (creado && d.evento) { try { await registrarEvento(d.evento, "contacto"); } catch {} }
    return NextResponse.json({ ok: true, baja: "/privacidad/baja#" + token }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No se guardaron tus datos. Revisa los campos o continúa directamente en WhatsApp." }, { status: 400 }); }
}
