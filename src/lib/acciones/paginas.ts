"use server";

import { revalidatePath } from "next/cache";
import {
  archivoDe,
  borrarImagen,
  clienteConSesion,
  fallo,
  ok,
  SIN_SESION,
  subirImagen,
  type Resultado,
} from "./comun";
import { clasesSchema, erroresPorCampo, sobreMiSchema } from "@/lib/validacion";
import type { ClasesContenido, SobreMiContenido } from "@/types/database";

/** Guarda «Sobre mí»: retrato y biografía en un solo formulario (§07). */
export async function guardarSobreMi(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = sobreMiSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    biografia: String(formData.get("biografia") ?? ""),
    cita: String(formData.get("cita") ?? ""),
    retrato_alt: String(formData.get("retrato_alt") ?? ""),
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { data: actual } = await supabase
    .from("pagina")
    .select("contenido")
    .eq("clave", "sobre-mi")
    .maybeSingle();

  const previo = (actual?.contenido ?? {}) as Partial<SobreMiContenido>;

  // El retrato solo cambia si se subió uno nuevo.
  const archivo = archivoDe(formData, "retrato");
  let retratoPath = previo.retrato_path ?? null;

  if (archivo) {
    const subida = await subirImagen(supabase, archivo, "retratos");
    if ("error" in subida) return fallo(subida.error);
    retratoPath = subida.path;
  }

  const { titulo, biografia, cita, retrato_alt } = analisis.data;
  const contenido: SobreMiContenido = {
    titulo,
    biografia,
    cita: cita ? cita : null,
    retrato_path: retratoPath,
    retrato_alt: retrato_alt ? retrato_alt : null,
  };

  const { error } = await supabase
    .from("pagina")
    .upsert({ clave: "sobre-mi", contenido }, { onConflict: "clave" });

  if (error) {
    if (archivo && retratoPath) await borrarImagen(supabase, retratoPath);
    return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");
  }

  // Recién con la página apuntando al retrato nuevo, borramos el anterior.
  if (archivo && previo.retrato_path && previo.retrato_path !== retratoPath) {
    await borrarImagen(supabase, previo.retrato_path);
  }

  revalidatePath("/sobre-mi");
  revalidatePath("/admin/sobre-mi");
  return ok("Página «Sobre mí» actualizada.");
}

/** Guarda «Clases»: el texto y las técnicas que ofrece. */
export async function guardarClases(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = clasesSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    introduccion: String(formData.get("introduccion") ?? ""),
    tecnicas: String(formData.get("tecnicas") ?? ""),
    nota: String(formData.get("nota") ?? ""),
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { titulo, introduccion, tecnicas, nota } = analisis.data;

  const contenido: ClasesContenido = {
    titulo,
    introduccion,
    // Una técnica por línea en el formulario.
    tecnicas: (tecnicas ?? "")
      .split("\n")
      .map((linea) => linea.trim())
      .filter(Boolean),
    nota: nota ? nota : null,
  };

  const { error } = await supabase
    .from("pagina")
    .upsert({ clave: "clases", contenido }, { onConflict: "clave" });

  if (error) return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");

  revalidatePath("/clases");
  revalidatePath("/admin/clases");
  return ok("Página «Clases» actualizada.");
}
