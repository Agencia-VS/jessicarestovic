import Link from "next/link";
import { adminComercial } from "@/lib/comercial/servidor";
import { rangoFechas, porcentaje } from "@/lib/comercial/estadisticas";
import type { Periodo } from "@/lib/comercial/tipos";

export default async function Estadisticas({ searchParams }: { searchParams: Promise<{ dias?: string; desde?: string; hasta?: string }> }) {
  const db = await adminComercial();
  if (!db) return <div><h1 className="text-2xl">Estadísticas</h1><p className="mt-4">Este módulo requiere habilitación para tu cuenta de administración. Revisa la configuración de acceso antes de activarlo.</p></div>;
  const { desde, hasta } = rangoFechas(await searchParams);
  const { data, error } = await db.rpc("resumen_comercial", { p_desde:desde, p_hasta:hasta });
  if (error || !data) return <p role="alert">No pudimos consultar las estadísticas. Revisa la migración del módulo comercial.</p>;
  const vacio: Periodo = { periodo:"actual", vistas:0, sesiones:0, conversiones:0, whatsapp:0, email:0, instagram:0 };
  const actual = data.periodos.find((p) => p.periodo === "actual") ?? vacio;
  const previo = data.periodos.find((p) => p.periodo === "anterior") ?? vacio;
  const tarjetas: [string, string | number, string | number][] = [
    ["Visitas medidas",actual.sesiones,previo.sesiones], ["Páginas vistas",actual.vistas,previo.vistas],
    ["Contactos registrados",data.contactos,data.contactos_anteriores],
    ["Conversión de contacto",porcentaje(actual.conversiones,actual.sesiones) + "%",porcentaje(previo.conversiones,previo.sesiones) + "%"],
  ];
  const desgloses: { titulo: string; filas: { etiqueta: string; cantidad: number }[] }[] = [
    { titulo:"Procedencia", filas:data.fuentes.map((f) => ({ etiqueta:f.origen, cantidad:f.sesiones })) },
    { titulo:"Dispositivo", filas:data.dispositivos.map((d) => ({ etiqueta:d.dispositivo, cantidad:d.sesiones })) },
  ];
  const max = Math.max(1,...data.dias.map((d) => d.sesiones));
  return <div className="flex flex-col gap-7">
    <div><h1 className="text-2xl">Estadísticas</h1><p className="mt-2 text-sm text-muted">Del {desde} al {hasta} · horario de Chile. Comparación con el período anterior de igual duración.</p></div>
    <div className="flex flex-wrap gap-3">{[7,30,90].map((d) => <Link key={d} href={"?dias=" + d} className="border border-line px-3 py-2">{d} días</Link>)}</div>
    <form className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Desde<input name="desde" type="date" required defaultValue={desde} className="block border border-line p-2" /></label>
      <label className="text-sm">Hasta<input name="hasta" type="date" required defaultValue={hasta} className="block border border-line p-2" /></label>
      <button className="border border-ink px-4 py-2">Aplicar</button><p className="text-xs text-muted">Máximo 90 días por consulta, dentro de los últimos 180.</p>
    </form>
    <div className="grid gap-4 sm:grid-cols-2">{tarjetas.map(([titulo,valor,anterior]) => <div key={titulo} className="border border-line p-5"><p className="text-sm text-muted">{titulo}</p><p className="my-2 text-3xl">{valor}</p><p className="text-xs text-muted">Período anterior: {anterior}</p></div>)}</div>
    <section><h2 className="mb-4 text-lg">Visitas por día</h2>{!data.dias.length ? <p className="text-sm text-muted">Todavía no hay visitas medidas en este período.</p> : <div className="max-h-64 overflow-auto">{data.dias.map((d) => <div key={d.dia} className="mb-2 flex items-center gap-3 text-xs"><span className="w-24 shrink-0">{d.dia}</span><div className="h-3 bg-line-soft" style={{ width:d.sesiones/max*65 + "%", minWidth:2 }} /><span>{d.sesiones}</span></div>)}</div>}</section>
    <section><h2 className="mb-3 text-lg">Acciones de contacto</h2><div className="grid grid-cols-3 gap-3">{[["WhatsApp",actual.whatsapp],["Correo",actual.email],["Instagram",actual.instagram]].map(([label,n]) => <div key={label} className="border border-line p-3"><p className="text-sm">{label}</p><strong className="text-xl font-normal">{n}</strong><p className="text-xs text-muted">clics</p></div>)}</div></section>
    <section><h2 className="mb-3 text-lg">Páginas más vistas</h2><table className="w-full text-sm"><thead><tr className="border-b border-line text-left"><th className="py-2">Página</th><th>Vistas</th></tr></thead><tbody>{data.paginas.map((p) => <tr key={p.ruta} className="border-b border-line"><td className="break-all py-2"><Link href={p.ruta}>{p.ruta}</Link></td><td>{p.vistas}</td></tr>)}</tbody></table></section>
    <div className="grid gap-5 sm:grid-cols-2">{desgloses.map(({ titulo, filas }) => <section key={titulo}><h2 className="mb-2 text-lg">{titulo}</h2>{filas.map((fila) => <p key={fila.etiqueta} className="flex justify-between border-b border-line py-2 text-sm"><span>{fila.etiqueta}</span><span>{fila.cantidad}</span></p>)}</section>)}</div>
    <p className="border-t border-line pt-4 text-sm leading-relaxed text-muted">Una visita es una sesión con 30 minutos de inactividad como límite. La conversión cuenta sesiones medidas con al menos un clic de contacto o un contacto registrado, una sola vez por sesión. Los contactos registrados incluyen también personas que rechazaron analítica. Los clics no confirman mensajes enviados ni ventas. La medición comienza al activarla y depende del consentimiento y de los bloqueadores; excluye el administrador y las vistas de prueba. Las comparaciones que alcancen fechas anteriores a la activación o a los 180 días conservados pueden estar incompletas.</p>
  </div>;
}
