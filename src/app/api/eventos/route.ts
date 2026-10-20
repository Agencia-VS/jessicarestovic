import { NextResponse } from "next/server";
import { ingreso, leerJson } from "@/lib/comercial/servidor";
import { eventoSchema, registrarEvento } from "@/lib/comercial/eventos-servidor";
export async function POST(request: Request) {
  try {
    if (!await ingreso(request, "eventos", 3000)) return new NextResponse(null, { status: 429 });
    await registrarEvento(eventoSchema.parse(await leerJson(request)));
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 400 }); }
}
