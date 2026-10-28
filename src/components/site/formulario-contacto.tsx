"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { MOTIVOS, type Motivo } from "@/lib/comercial/tipos";
import { eventoParaContacto, medir } from "@/lib/comercial/cliente";

export function FormularioContacto({ whatsappUrl, grupo, captacion }: { whatsappUrl: string; grupo: { id: string; titulo: string; ruta: string } | null; captacion: boolean }) {
  const [nombre, setNombre] = useState("");
  const [motivo, setMotivo] = useState<Motivo>(grupo ? "obra" : "otra");
  const [comentario, setComentario] = useState("");
  const [guardar, setGuardar] = useState(false);
  const [novedades, setNovedades] = useState(false);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [listo, setListo] = useState(false);
  const [baja, setBaja] = useState("");
  const intento = useRef<{ id: string; contenido: string } | null>(null);
  const url = new URL(whatsappUrl);
  const texto = [
    nombre.trim() ? "Hola Jessica, soy " + nombre.trim() + "." : "Hola Jessica.",
    "Te escribo desde tu sitio: " + MOTIVOS[motivo].toLowerCase() + ".",
    grupo ? "Me interesa: " + grupo.titulo + "." : "",
    grupo?.ruta ?? "",
    comentario.trim(),
  ].filter(Boolean).join("\n");
  url.searchParams.set("text", texto);
  const href = url.toString();
  const campo = "w-full border-b border-line bg-transparent py-2 outline-offset-4";
  async function continuar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setAviso("");
    if (!guardar) { medir("whatsapp"); window.location.assign(href); return; }
    setOcupado(true);
    const contenido = JSON.stringify({ nombre, email, motivo, grupo:grupo?.id, novedades });
    if (intento.current?.contenido !== contenido) intento.current = { id:crypto.randomUUID(), contenido };
    try {
      const empresa = String(new FormData(e.currentTarget).get("empresa") ?? "");
      const res = await fetch("/api/contactos", { method:"POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ id:intento.current.id, nombre, email, motivo, grupo:grupo?.id ?? null, guardar:true, novedades, empresa, evento:eventoParaContacto() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBaja(data.baja); setListo(true);
      setAviso("Tus datos se guardaron. Abre WhatsApp y pulsa Enviar para hacer llegar tu consulta.");
    } catch (error) { setAviso(error instanceof Error ? error.message : "No se guardaron los datos. Puedes continuar directamente en WhatsApp."); }
    finally { setOcupado(false); }
  }
  if (listo) return <div className="flex flex-col gap-4">
    <p role="status">{aviso}</p>
    <a href={href} target="_blank" rel="noopener noreferrer" className="border border-ink px-4 py-3 text-center">Abrir WhatsApp</a>
    {novedades && <p className="text-sm">Guarda este <a href={baja} className="underline">enlace para darte de baja</a>. También puedes pedirlo por correo desde Privacidad.</p>}
    <button type="button" className="self-start underline" onClick={() => { setListo(false); setGuardar(false); setNovedades(false); intento.current = null; }}>Preparar otra consulta</button>
  </div>;
  return <form onSubmit={continuar} className="flex flex-col gap-5">
    <p className="text-sm text-muted">Prepara tu consulta y continúa en WhatsApp. Allí podrás revisarla y pulsar Enviar.</p>
    {grupo && <p className="border-l border-line pl-3">Sobre: {grupo.titulo}</p>}
    <label className="flex flex-col gap-1">Motivo<select className={campo} value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo)}>{Object.entries(MOTIVOS).map(([valor, titulo]) => <option key={valor} value={valor}>{titulo}</option>)}</select></label>
    <label className="flex flex-col gap-1">Nombre {guardar ? "" : "(opcional)"}<input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} required={guardar} minLength={guardar ? 2 : undefined} maxLength={100} autoComplete="name" /></label>
    <label className="flex flex-col gap-1">Comentario (opcional)<textarea className={campo} rows={3} maxLength={1200} value={comentario} onChange={(e) => setComentario(e.target.value)} /></label>
    {captacion && <fieldset className="flex flex-col gap-4 border border-line p-4 text-sm">
      <legend className="px-2">Opciones de contacto</legend>
      <label className="flex items-start gap-3"><input type="checkbox" className="mt-1" checked={guardar} onChange={(e) => { setGuardar(e.target.checked); if (!e.target.checked) setNovedades(false); }} />Autorizo guardar mi nombre, correo e interés durante hasta 12 meses desde la última gestión para dar seguimiento a mi consulta.</label>
      {guardar && <>
        <label>Correo<input className={campo} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1" checked={novedades} onChange={(e) => setNovedades(e.target.checked)} />También quiero recibir por correo novedades de obras y exposiciones. Puedo darme de baja cuando quiera.</label>
      </>}
      <p>Ambas opciones son voluntarias. El comentario se prepara para WhatsApp y no se guarda en el sitio. <Link href="/privacidad" className="underline">Política de privacidad</Link>.</p>
    </fieldset>}
    <div className="hidden" aria-hidden="true"><label>Empresa<input name="empresa" tabIndex={-1} autoComplete="off" /></label></div>
    {aviso && <p role="alert" className="text-sm">{aviso}</p>}
    <button type="submit" disabled={ocupado} className="border border-ink px-4 py-3 disabled:opacity-50">{ocupado ? "Guardando…" : guardar ? "Guardar datos y continuar" : "Continuar en WhatsApp"}</button>
    {guardar && <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm underline">Continuar en WhatsApp sin guardar datos</a>}
    <button type="button" className="self-start text-sm underline" onClick={async () => { try { await navigator.clipboard.writeText(texto); setAviso("Mensaje copiado."); } catch { setAviso("No se pudo copiar. Abre WhatsApp para ver el mensaje."); } }}>Copiar mensaje</button>
  </form>;
}
