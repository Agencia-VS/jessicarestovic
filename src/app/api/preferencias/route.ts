import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ingreso, leerJson, servicio, firmar, verificar, preferenciaSchema, opcionesCookie } from "@/lib/comercial/servidor";
import { VERSION_PRIVACIDAD } from "@/lib/comercial/tipos";
export async function POST(request: Request) {
  try {
    if (!await ingreso(request, "preferencias", 200)) return NextResponse.json({ error: "No se pudo guardar. Inténtalo de nuevo." }, { status: 429 });
    const { aceptada } = z.object({ aceptada: z.boolean() }).strict().parse(await leerJson(request));
    const jar = await cookies();
    const anterior = preferenciaSchema.safeParse(verificar(jar.get("jr_preferencia")?.value));
    const db = servicio();
    if (anterior.success) {
      const { error } = await db.from("preferencia_analitica").update({ aceptada: false }).eq("id", anterior.data.id);
      if (error) throw error;
    }
    const preferencia = { id: randomUUID(), aceptada, version: VERSION_PRIVACIDAD, fecha: Date.now() };
    const { error } = await db.from("preferencia_analitica").insert({ id: preferencia.id, aceptada, version: VERSION_PRIVACIDAD });
    if (error) throw error;
    jar.set("jr_preferencia", firmar(preferencia), { ...opcionesCookie, maxAge: 180 * 86400 });
    jar.delete("jr_sesion");
    return NextResponse.json({ aceptada }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la preferencia. La medición permanece desactivada hasta confirmar." }, { status: 400 });
  }
}
