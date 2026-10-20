"use client";
import { useState } from "react";
export function BajaNovedades() {
  const [aviso,setAviso] = useState("");
  const [ocupado,setOcupado] = useState(false);
  async function retirar() {
    const token = window.location.hash.slice(1);
    if (!/^[a-f0-9]{64}$/.test(token)) { setAviso("El enlace no es válido. Solicita la baja por el correo de privacidad."); return; }
    setOcupado(true);
    try {
      const res = await fetch("/api/baja", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token}) });
      if (!res.ok) throw new Error();
      setAviso("Si el registro estaba activo, se retiró la autorización para recibir novedades.");
      window.history.replaceState(null,"",window.location.pathname);
    } catch { setAviso("No pudimos procesar la baja. Inténtalo nuevamente o escribe al correo de privacidad."); }
    finally { setOcupado(false); }
  }
  return <div className="flex flex-col gap-4"><button type="button" disabled={ocupado} onClick={retirar} className="self-start border border-ink px-5 py-3 disabled:opacity-50">{ocupado ? "Procesando…" : "Dejar de recibir novedades"}</button><p role="status">{aviso}</p></div>;
}
