import Link from "next/link";
import { adminComercial } from "@/lib/comercial/servidor";
import { MOTIVOS } from "@/lib/comercial/tipos";
import { AccionesContacto } from "@/components/admin/acciones-contacto";
export default async function Contactos({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const db = await adminComercial();
  if (!db) return <div><h1 className="text-2xl">Contactos</h1><p className="mt-4">Este módulo requiere habilitación para tu cuenta de administración.</p></div>;
  const params = await searchParams;
  const pagina = Math.max(1,Math.min(10000,Math.floor(Number(params.pagina)) || 1));
  const { data, count, error } = await db.from("contacto_lead").select("*", { count:"exact" }).order("creado_en", { ascending:false }).order("id").range((pagina-1)*50,pagina*50-1);
  if (error) return <p role="alert">No pudimos cargar los contactos.</p>;
  const ids = (data ?? []).map((d) => d.id);
  const consentimientos = ids.length ? await db.from("consentimiento_contacto").select("*").in("contacto_id",ids).order("creado_en", { ascending:false }) : { data:[], error:null };
  const gruposIds = [...new Set((data ?? []).map((d) => d.grupo_id).filter((id): id is string => Boolean(id)))];
  const grupos = gruposIds.length ? await db.from("exposicion").select("id,titulo").in("id",gruposIds) : { data:[] };
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl">Contactos</h1><p className="mt-2 text-sm text-muted">Personas que autorizaron guardar sus datos. Una consulta registrada no confirma que se haya enviado por WhatsApp.</p></div>
    <div className="flex flex-wrap gap-4 text-sm"><a href="/admin/contactos-exportar" className="underline">Exportar CSV</a><Link href="/admin/mensajes" className="underline">Archivo de mensajes anteriores</Link></div>
    <p className="text-sm">{count ?? 0} contactos · página {pagina}</p>
    {!data?.length && <p>Todavía no hay contactos en esta página.</p>}
    {data?.map((c) => <article key={c.id} className="flex flex-col gap-3 border border-line p-5">
      <div><h2 className="text-lg">{c.nombre}</h2><a className="break-all text-sm underline" href={"mailto:" + c.email}>{c.email}</a></div>
      <p className="text-sm">{MOTIVOS[c.motivo]}{c.grupo_id ? " · " + (grupos.data?.find((g) => g.id === c.grupo_id)?.titulo ?? "Contenido retirado") : ""}</p>
      <p className="text-xs text-muted">{new Date(c.creado_en).toLocaleString("es-CL",{ timeZone:"America/Santiago" })} · Novedades por correo: {c.novedades ? "autorizadas" : "sin autorización"}</p>
      <AccionesContacto contacto={c} />
      <details className="text-xs"><summary className="cursor-pointer">Historial de autorizaciones</summary>{consentimientos.error ? <p>No se pudo consultar el historial.</p> : consentimientos.data?.filter((a) => a.contacto_id === c.id).map((a) => <p key={a.id} className="mt-2">{a.finalidad === "guardar_contacto" ? "Guardar contacto" : "Novedades por correo"}: {a.otorgado ? "sí" : "no"} · versión {a.version} · {new Date(a.creado_en).toLocaleString("es-CL", { timeZone:"America/Santiago" })}</p>)}</details>
    </article>)}
    <div className="flex gap-4">{pagina > 1 && <Link href={"?pagina=" + (pagina-1)} className="underline">Anterior</Link>}{pagina*50 < (count ?? 0) && <Link href={"?pagina=" + (pagina+1)} className="underline">Siguiente</Link>}</div>
  </div>;
}
