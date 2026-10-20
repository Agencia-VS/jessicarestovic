import { NextResponse } from "next/server";
import { z } from "zod";
import { ingreso, leerJson, servicio, hash } from "@/lib/comercial/servidor";
import { VERSION_PRIVACIDAD } from "@/lib/comercial/tipos";
export async function POST(request: Request) {
  try {
    if (!await ingreso(request, "baja", 100)) return NextResponse.json({ error: "Inténtalo nuevamente en unos minutos." }, { status: 429 });
    const { token } = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(await leerJson(request));
    const { error } = await servicio().rpc("retirar_novedades", { p_hash: hash(token), p_version: VERSION_PRIVACIDAD });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No pudimos procesar la baja. Utiliza el correo de privacidad." }, { status: 400 }); }
}
