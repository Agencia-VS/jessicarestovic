"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archivoDe,
  booleano,
  borrarImagen,
  clienteConSesion,
  enteroONulo,
  fallo,
  ok,
  SIN_SESION,
  subirImagen,
  textoONulo,
  type Resultado,
} from "./comun";
import { erroresPorCampo, obraSchema, slugify } from "@/lib/validacion";

/** Rutas que dependen de las obras. */
function revalidarObras(): void {
  revalidatePath("/");
  revalidatePath("/obra");
  revalidatePath("/admin/obras");
}

/**
 * Lee y valida los campos comunes de una obra.
 * Devuelve los datos listos para guardar, o los errores por campo.
 */
function leerCampos(formData: FormData) {
  const crudos = {
    titulo: String(formData.get("titulo") ?? ""),
    serie_id: textoONulo(formData.get("serie_id")),
    anio: enteroONulo(formData.get("anio")),
    tecnica: String(formData.get("tecnica") ?? ""),
    dimensiones: String(formData.get("dimensiones") ?? ""),
    imagen_alt: String(formData.get("imagen_alt") ?? ""),
    destacada: booleano(formData.get("destacada")),
    publicada: booleano(formData.get("publicada")),
    orden: enteroONulo(formData.get("orden")) ?? 0,
  };

  const analisis = obraSchema.safeParse(crudos);
  if (!analisis.success) {
    return { errores: erroresPorCampo(analisis.error) } as const;
  }

  const d = analisis.data;
  return {
    datos: {
      titulo: d.titulo,
      serie_id: d.serie_id ?? null,
      anio: d.anio ?? null,
      tecnica: d.tecnica ? d.tecnica : null,
      dimensiones: d.dimensiones ? d.dimensiones : null,
      imagen_alt: d.imagen_alt,
      destacada: d.destacada,
      publicada: d.publicada,
      orden: d.orden,
    },
  } as const;
}

/** Medidas que el navegador leyó de la foto antes de subirla. */
function leerMedidas(formData: FormData) {
  return {
    imagen_ancho: enteroONulo(formData.get("imagen_ancho")),
    imagen_alto: enteroONulo(formData.get("imagen_alto")),
  };
}

export async function crearObra(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const campos = leerCampos(formData);
  if ("errores" in campos) return fallo("Revisa los campos marcados.", campos.errores);

  const archivo = archivoDe(formData, "imagen");
  if (!archivo) return fallo("Falta la foto de la obra.");

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const subida = await subirImagen(supabase, archivo, "obras");
  if ("error" in subida) return fallo(subida.error);

  const { error } = await supabase.from("obra").insert({
    ...campos.datos,
    ...leerMedidas(formData),
    imagen_path: subida.path,
  });

  if (error) {
    // Si la fila no se creó, la foto subida quedaría huérfana.
    await borrarImagen(supabase, subida.path);
    return fallo("No pudimos publicar la obra. Vuelve a intentar en un momento.");
  }

  revalidarObras();
  redirect("/admin/obras?aviso=obra-creada");
}

export async function editarObra(
  id: string,
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const campos = leerCampos(formData);
  if ("errores" in campos) return fallo("Revisa los campos marcados.", campos.errores);

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { data: actual } = await supabase
    .from("obra")
    .select("imagen_path")
    .eq("id", id)
    .maybeSingle();

  if (!actual) return fallo("Esa obra ya no existe.");

  // Si viene una foto nueva, reemplaza la anterior.
  const archivo = archivoDe(formData, "imagen");
  let imagen: { imagen_path: string; imagen_ancho: number | null; imagen_alto: number | null } | null =
    null;

  if (archivo) {
    const subida = await subirImagen(supabase, archivo, "obras");
    if ("error" in subida) return fallo(subida.error);
    imagen = { imagen_path: subida.path, ...leerMedidas(formData) };
  }

  const { error } = await supabase
    .from("obra")
    .update({ ...campos.datos, ...(imagen ?? {}) })
    .eq("id", id);

  if (error) {
    if (imagen) await borrarImagen(supabase, imagen.imagen_path);
    return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");
  }

  // Recién ahora que la fila apunta a la foto nueva, borramos la vieja.
  if (imagen && actual.imagen_path !== imagen.imagen_path) {
    await borrarImagen(supabase, actual.imagen_path);
  }

  revalidarObras();
  return ok("Cambios guardados.");
}

export async function eliminarObra(id: string): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  const { data: obra } = await supabase
    .from("obra")
    .select("imagen_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("obra").delete().eq("id", id);
  if (!error && obra) await borrarImagen(supabase, obra.imagen_path);

  revalidarObras();
}

/** Publica u oculta una obra desde la grilla, sin abrir el formulario. */
export async function alternarPublicada(id: string, publicada: boolean): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("obra").update({ publicada }).eq("id", id);
  revalidarObras();
}

/** Marca o desmarca una obra como destacada en Inicio. */
export async function alternarDestacada(id: string, destacada: boolean): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("obra").update({ destacada }).eq("id", id);
  revalidarObras();
}

/**
 * Guarda el orden nuevo tras arrastrar y soltar en la grilla. Recibe los ids
 * en el orden final, así Jessica nunca escribe un número de orden a mano.
 */
export async function reordenarObras(ids: string[]): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await Promise.all(
    ids.map((id, indice) => supabase.from("obra").update({ orden: indice }).eq("id", id)),
  );

  revalidarObras();
}

/**
 * Crea una serie desde el formulario de obra, sin salir de él («crear serie
 * nueva» del paso 3, §07). Devuelve el id para dejarla ya seleccionada.
 */
export async function crearSerieRapida(nombre: string): Promise<{ id: string } | { error: string }> {
  const limpio = nombre.trim();
  if (limpio.length < 2) return { error: "La serie necesita un nombre." };

  const supabase = await clienteConSesion();
  if (!supabase) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const { data, error } = await supabase
    .from("serie")
    .insert({ nombre: limpio, slug: slugify(limpio) })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No pudimos crear la serie. ¿Ya existe una con ese nombre?" };
  }

  revalidatePath("/admin/obras");
  revalidatePath("/admin/series");
  return { id: data.id };
}
