"use server";

import { revalidatePath } from "next/cache";
import {
  clienteConSesion,
  enteroONulo,
  fallo,
  ok,
  SIN_SESION,

  type Resultado,
} from "./comun";
import { erroresPorCampo, serieSchema, slugify } from "@/lib/validacion";

function revalidarSeries(): void {
  revalidatePath("/obra");
  revalidatePath("/admin/series");
  revalidatePath("/admin/obras");
}

export async function crearSerie(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const analisis = serieSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    orden: enteroONulo(formData.get("orden")) ?? 0,
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { nombre, descripcion, orden } = analisis.data;
  const { error } = await supabase.from("serie").insert({
    nombre,
    slug: slugify(nombre),
    descripcion: descripcion ? descripcion : null,
    orden,
  });

  if (error) {
    return fallo("No pudimos crear la serie. ¿Ya existe una con ese nombre?");
  }

  revalidarSeries();
  return ok(`Serie «${nombre}» creada.`);
}

export async function editarSerie(
  id: string,
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = serieSchema.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    orden: enteroONulo(formData.get("orden")) ?? 0,
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { nombre, descripcion, orden } = analisis.data;
  const { error } = await supabase
    .from("serie")
    .update({
      nombre,
      slug: slugify(nombre),
      descripcion: descripcion ? descripcion : null,
      orden,
    })
    .eq("id", id);

  if (error) return fallo("No pudimos guardar los cambios de la serie.");

  revalidarSeries();
  return ok("Serie actualizada.");
}

/**
 * Elimina una serie. Las obras que la tenían quedan sin serie —no se borran—
 * por el `on delete set null` del esquema.
 */
export async function eliminarSerie(id: string): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("serie").delete().eq("id", id);
  revalidarSeries();
}

export async function reordenarSeries(ids: string[]): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await Promise.all(
    ids.map((id, indice) => supabase.from("serie").update({ orden: indice }).eq("id", id)),
  );

  revalidarSeries();
}

