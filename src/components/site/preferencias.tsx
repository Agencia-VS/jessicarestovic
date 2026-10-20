"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { activarMedicion, medir } from "@/lib/comercial/cliente";

export function Preferencias({ inicial, habilitada, children }: { inicial: boolean | null; habilitada: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [aceptada, setAceptada] = useState(inicial);
  const [abierto, setAbierto] = useState(inicial === null);
  const [configurando, setConfigurando] = useState(false);
  const [seleccion, setSeleccion] = useState(inicial ?? false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const ultima = useRef("");
  const panel = pathname.startsWith("/admin");
  useEffect(() => {
    let bloqueo = false;
    try { bloqueo = localStorage.getItem("jr-analitica-bloqueada") === "1"; } catch { bloqueo = true; }
    const activo = habilitada && aceptada === true && !panel && !bloqueo;
    activarMedicion(activo);
    if (activo && ultima.current !== pathname) { ultima.current = pathname; medir("pagina"); }
    if (!activo) ultima.current = "";
    return () => activarMedicion(false);
  }, [aceptada, pathname, habilitada, panel]);
  useEffect(() => {
    const sincronizar = (e: StorageEvent) => {
      if (e.key === "jr-analitica-bloqueada" && e.newValue === "1") { activarMedicion(false); setAceptada(false); }
    };
    const abrir = () => { setAbierto(true); setConfigurando(true); };
    const clic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const enlace = (e.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!enlace) return;
      try {
        const url = new URL(enlace.href);
        if (url.protocol === "mailto:") medir("email");
        else if (url.hostname === "wa.me") medir("whatsapp");
        else if (/^(www\.)?instagram\.com$/.test(url.hostname)) medir("instagram");
      } catch {}
    };
    window.addEventListener("storage", sincronizar);
    window.addEventListener("jr-preferencias", abrir);
    document.addEventListener("click", clic);
    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener("jr-preferencias", abrir);
      document.removeEventListener("click", clic);
    };
  }, []);
  async function guardar(valor: boolean) {
    if (!habilitada) { setAbierto(false); return; }
    setGuardando(true); setError(""); activarMedicion(false);
    try { localStorage.setItem("jr-analitica-bloqueada", "1"); } catch {}
    try {
      const res = await fetch("/api/preferencias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aceptada: valor }) });
      if (!res.ok) throw new Error();
      try { if (valor) localStorage.removeItem("jr-analitica-bloqueada"); else localStorage.setItem("jr-analitica-bloqueada", "1"); } catch {}
      ultima.current = "";
      setAceptada(valor); setSeleccion(valor); setAbierto(false);
      activarMedicion(valor && habilitada && !panel);
      if (valor && habilitada && !panel) { ultima.current = pathname; medir("pagina"); }
    } catch { setAceptada(false); setError("No pudimos guardar. La medición está desactivada. Puedes seguir navegando y volver a intentarlo."); }
    finally { setGuardando(false); }
  }
  return <>{children}{!panel && abierto && (habilitada || configurando) && <section aria-label="Preferencias de privacidad" className="fixed right-4 bottom-4 left-4 z-80 max-h-[75dvh] overflow-auto border border-line bg-paper p-5 shadow-lg sm:left-auto sm:max-w-md">
    <h2 className="mb-2 text-lg">Tu privacidad</h2>
    {!habilitada && <p className="mb-3 text-sm">La analítica está desactivada en esta versión del sitio.</p>}
    <p className="mb-3 text-sm leading-relaxed">Con tu permiso medimos visitas y clics para mejorar el sitio. Puedes rechazar la analítica y seguir navegando o escribiendo a Jessica. <Link href="/privacidad" className="underline">Ver privacidad</Link>.</p>
    {configurando && <div className="mb-4 flex flex-col gap-3 text-sm">
      <p>Esenciales: recordar tu elección y proteger formularios.</p>
      <label className="flex gap-3"><input type="checkbox" checked={seleccion} onChange={(e) => setSeleccion(e.target.checked)} />Analítica opcional de visitas y clics</label>
      <p>Las novedades se autorizan por separado en Contacto.</p>
    </div>}
    <div className="flex flex-wrap gap-2">
      <button disabled={guardando} onClick={() => guardar(false)} className="border border-ink px-4 py-2 text-sm">Rechazar</button>
      <button disabled={guardando} onClick={() => guardar(true)} className="border border-ink px-4 py-2 text-sm">Aceptar analítica</button>
      {configurando ? <button disabled={guardando} onClick={() => guardar(seleccion)} className="border border-ink px-4 py-2 text-sm">Guardar selección</button> : <button onClick={() => setConfigurando(true)} className="px-2 py-2 text-sm underline">Configurar</button>}
    </div>
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
  </section>}</>;
}
export function BotonPreferencias() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("jr-preferencias"))} className="eyebrow text-muted underline underline-offset-4">Preferencias de privacidad</button>;
}
