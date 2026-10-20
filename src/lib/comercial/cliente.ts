"use client";
import type { Evento, Origen, Dispositivo } from "./tipos";
let activo = false;
let cola: Promise<unknown> = Promise.resolve();
export function activarMedicion(valor: boolean) { activo = valor; }
export function datosEvento(evento: Exclude<Evento, "contacto">) {
  let origen: Origen = "directo";
  try {
    const fuente = new URL(location.href).searchParams.get("utm_source")?.toLowerCase();
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    if (fuente === "instagram" || /(^|\.)instagram\.com$/.test(host)) origen = "instagram";
    else if (fuente === "facebook" || /(^|\.)facebook\.com$/.test(host)) origen = "facebook";
    else if (fuente === "google" || /(^|\.)google\.(com|cl)$/.test(host)) origen = "google";
    else if (fuente === "bing" || /(^|\.)bing\.com$/.test(host)) origen = "bing";
    else if (host && host !== location.hostname) origen = "otro";
  } catch {}
  const dispositivo: Dispositivo = innerWidth < 640 ? "movil" : innerWidth < 1024 ? "tablet" : "computador";
  return { id: crypto.randomUUID(), evento, ruta: location.pathname, origen, dispositivo };
}
export function eventoParaContacto() { return activo ? datosEvento("pagina") : undefined; }
export function medir(evento: Exclude<Evento, "contacto">) {
  if (!activo || location.pathname.startsWith("/admin")) return;
  const datos = datosEvento(evento);
  cola = cola.catch(() => {}).then(async () => {
    if (!activo) return;
    await fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), keepalive: true });
  }).catch(() => {});
}
