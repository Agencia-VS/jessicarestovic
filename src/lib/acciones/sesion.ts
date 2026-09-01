"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import { fallo, ok, type Resultado } from "./resultado";

/** Ruta a la que se entra después de iniciar sesión. */
const DESTINO = "/admin/obras";

export async function iniciarSesion(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const volver = String(formData.get("volver") ?? "");

  if (!email || !password) {
    return fallo("Escribe tu correo y tu contraseña.");
  }
  if (!supabaseConfigurado()) {
    return fallo("El panel todavía no está conectado a la base de datos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // No distinguimos «correo no existe» de «contraseña incorrecta»: eso
    // permitiría averiguar qué correos tienen cuenta.
    return fallo("El correo o la contraseña no coinciden. Vuelve a intentar.");
  }

  revalidatePath("/admin", "layout");
  redirect(volver && volver.startsWith("/admin") ? volver : DESTINO);
}

export async function cerrarSesion(): Promise<void> {
  if (supabaseConfigurado()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}

/**
 * Envía el enlace de recuperación por correo. Alcanza con eso: no hace falta
 * un flujo complejo de «olvidé mi contraseña» (§07).
 */
export async function recuperarContrasena(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return fallo("Escribe tu correo para enviarte el enlace.");
  if (!supabaseConfigurado()) {
    return fallo("El panel todavía no está conectado a la base de datos.");
  }

  const supabase = await createClient();
  const origen = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/admin/login`,
  });

  // Respuesta igual exista o no la cuenta, por la misma razón que arriba.
  return ok("Si ese correo tiene cuenta, te llegará un enlace para crear una contraseña nueva.");
}
