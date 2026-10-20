import { NextResponse } from "next/server";
import { servicio } from "@/lib/comercial/servidor";
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET) return new NextResponse(null, { status: 401 });
  try {
    const { error } = await servicio().rpc("depurar_comercial", {});
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }, { status: 503 }); }
}
