"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdminComercial, servicio } from "@/lib/comercial/servidor";
import { VERSION_PRIVACIDAD } from "@/lib/comercial/tipos";
export async function gestionarContacto(formData: FormData) {
  const db = await exigirAdminComercial();
  const id = z.uuid().parse(formData.get("id"));
  const accion = z.enum(["estado","eliminar","baja"]).parse(formData.get("accion"));
  if (accion === "estado") {
    const estado = z.enum(["nuevo","contactado","conversacion","cerrado"]).parse(formData.get("estado"));
    const { error } = await db.from("contacto_lead").update({ estado, actualizado_en:new Date().toISOString() }).eq("id",id);
    if (error) throw new Error("No se pudo actualizar el contacto.");
  } else if (accion === "eliminar") {
    const { error } = await db.from("contacto_lead").delete().eq("id",id);
    if (error) throw new Error("No se pudo eliminar el contacto.");
  } else {
    const { data, error } = await db.from("contacto_lead").select("baja_hash").eq("id",id).single();
    if (error) throw new Error("No se encontró el contacto.");
    const resultado = await servicio().rpc("retirar_novedades", { p_hash:data.baja_hash, p_version:VERSION_PRIVACIDAD });
    if (resultado.error) throw new Error("No se pudo guardar la baja.");
  }
  revalidatePath("/admin/contactos");
}
