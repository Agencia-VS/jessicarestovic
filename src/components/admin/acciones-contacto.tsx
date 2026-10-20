"use client";
import { useState, useTransition } from "react";
import { gestionarContacto } from "@/lib/acciones/contactos";
import type { Lead } from "@/lib/comercial/tipos";
export function AccionesContacto({ contacto }: { contacto: Pick<Lead,"id"|"estado"|"novedades"> }) {
  const [aviso,setAviso] = useState("");
  const [pendiente,iniciar] = useTransition();
  const [confirmar,setConfirmar] = useState(false);
  function enviar(datos: FormData) {
    iniciar(async () => {
      try { await gestionarContacto(datos); setAviso("Guardado."); }
      catch { setAviso("No se guardó. Vuelve a intentarlo."); }
    });
  }
  return <div className="flex flex-col gap-2">
    <form action={enviar} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={contacto.id} />
      <select name="estado" defaultValue={contacto.estado} aria-label="Estado del contacto" className="border border-line p-2">
        <option value="nuevo">Nuevo</option><option value="contactado">Contactado</option><option value="conversacion">En conversación</option><option value="cerrado">Cerrado</option>
      </select>
      <button disabled={pendiente} name="accion" value="estado" className="underline">Guardar</button>
    </form>
    {contacto.novedades && <form action={enviar}><input type="hidden" name="id" value={contacto.id} /><button disabled={pendiente} name="accion" value="baja" className="text-sm underline">Retirar autorización de novedades</button></form>}
    {confirmar ? <form action={enviar} className="text-sm"><input type="hidden" name="id" value={contacto.id} /><p>Se eliminarán los datos y sus consentimientos. Esta acción no se puede deshacer.</p><button disabled={pendiente} name="accion" value="eliminar" className="mr-4 underline">Confirmar eliminación</button><button type="button" onClick={() => setConfirmar(false)} className="underline">Cancelar</button></form> : <button type="button" onClick={() => setConfirmar(true)} className="self-start text-sm underline">Eliminar datos</button>}
    <p role="status" className="text-sm">{aviso}</p>
  </div>;
}
