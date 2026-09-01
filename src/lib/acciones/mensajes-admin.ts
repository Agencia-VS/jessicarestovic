"use server";

import { revalidatePath } from "next/cache";
import { clienteConSesion } from "./comun";

export async function marcarLeido(id: string, leido: boolean): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("mensaje").update({ leido }).eq("id", id);
  revalidatePath("/admin/mensajes");
  revalidatePath("/admin", "layout");
}

export async function eliminarMensaje(id: string): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("mensaje").delete().eq("id", id);
  revalidatePath("/admin/mensajes");
  revalidatePath("/admin", "layout");
}
