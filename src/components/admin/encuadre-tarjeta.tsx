"use client";
import { useState } from "react";
import type { Exposicion } from "@/lib/data/tipos";
export function EncuadreTarjeta({ exposicion }: { exposicion: Exposicion }) {
  const [x, setX] = useState(exposicion.portada_foco_x ?? 50);
  const [y, setY] = useState(exposicion.portada_foco_y ?? 50);
  if (!exposicion.portada) return null;
  return <fieldset className="flex flex-col gap-4 border border-line p-5">
    <legend className="px-2">Encuadre de la tarjeta</legend>
    <p className="caption text-muted">Ajusta la parte visible en el cuadrado. La imagen original se conserva completa.</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={exposicion.portada.src} alt="Vista previa del encuadre" className="aspect-square w-full max-w-64 object-cover" style={{ objectPosition: x + "% " + y + "%" }} />
    <label className="flex flex-col gap-2">Horizontal <input name="portada_foco_x" type="range" min="0" max="100" value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
    <label className="flex flex-col gap-2">Vertical <input name="portada_foco_y" type="range" min="0" max="100" value={y} onChange={(e) => setY(Number(e.target.value))} /></label>
    <button type="button" className="self-start underline" onClick={() => { setX(50); setY(50); }}>Centrar</button>
  </fieldset>;
}
