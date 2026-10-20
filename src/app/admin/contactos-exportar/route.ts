import { adminComercial } from "@/lib/comercial/servidor";
import { csvCelda } from "@/lib/comercial/estadisticas";
export async function GET() {
  const db = await adminComercial();
  if (!db) return new Response("No autorizado", { status:403 });
  const filas = ["Nombre,Correo,Interes,Estado,Novedades por correo,Fecha"];
  for (let offset=0; ; offset+=500) {
    const { data, error } = await db.from("contacto_lead").select("nombre,email,motivo,estado,novedades,creado_en").order("creado_en").order("id").range(offset,offset+499);
    if (error) return new Response("No se pudo exportar", { status:503 });
    for (const c of data) filas.push([c.nombre,c.email,c.motivo,c.estado,c.novedades ? "Si" : "No",c.creado_en].map(csvCelda).join(","));
    if (data.length < 500) break;
  }
  return new Response("\uFEFF"+filas.join("\r\n"), { headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":"attachment; filename=contactos-jessica.csv", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } });
}
