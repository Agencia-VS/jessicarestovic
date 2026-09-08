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
  revalidatePath("/trabajos-recientes");
  revalidatePath("/exposiciones");
  revalidatePath("/exposiciones/[slug]", "page");
  revalidatePath("/exposiciones/[slug]/obras", "page");
  revalidatePath("/admin/trabajos-recientes");
  revalidatePath("/admin/exposiciones");
  revalidatePath("/admin/exposiciones/[id]", "page");
}

/**
 * Lee y valida los campos comunes de una obra. `orden` no forma parte del
 * formulario: al crear se asigna al final y al editar se conserva.
 */
function leerCampos(formData: FormData) {
  const crudos = {
    titulo: String(formData.get("titulo") ?? ""),
    exposicion_id: textoONulo(formData.get("exposicion_id")),
    conjunto: String(formData.get("conjunto") ?? ""),
    anio: enteroONulo(formData.get("anio")),
    tecnica: String(formData.get("tecnica") ?? ""),
    dimensiones: String(formData.get("dimensiones") ?? ""),
    imagen_alt: String(formData.get("imagen_alt") ?? ""),
    destacada: booleano(formData.get("destacada")),
    publicada: booleano(formData.get("publicada")),
  };

  const analisis = obraSchema.safeParse(crudos);
  if (!analisis.success) {
    return { errores: erroresPorCampo(analisis.error) } as const;
  }

  const d = analisis.data;
  return {
    datos: {
      titulo: d.titulo,
      exposicion_id: d.exposicion_id ?? null,
      conjunto: d.conjunto ? d.conjunto : null,
      anio: d.anio ?? null,
      tecnica: d.tecnica ? d.tecnica : null,
      dimensiones: d.dimensiones ? d.dimensiones : null,
      imagen_alt: d.imagen_alt,
      destacada: d.destacada,
      publicada: d.publicada,
    },
  } as const;
}

/** Canoniza la ortografía si ya existe ese conjunto en la misma exposición. */
async function canonizarConjunto(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteConSesion>>>,
  exposicionId: string | null,
  conjunto: string | null,
): Promise<string | null> {
  const limpio = conjunto?.trim() || null;
  if (!limpio) return null;

  let consulta = supabase.from("obra").select("conjunto").not("conjunto", "is", null);
  consulta = exposicionId
    ? consulta.eq("exposicion_id", exposicionId)
    : consulta.is("exposicion_id", null);
  const { data } = await consulta;

  const slug = slugify(limpio);
  const existente = data?.find(
    ({ conjunto: valor }) => valor && slugify(valor) === slug,
  )?.conjunto;
  return existente ?? limpio;
}

/** Asigna una obra nueva al final del grupo de su exposición. */
async function siguienteOrden(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteConSesion>>>,
  exposicionId: string | null,
): Promise<number> {
  let consulta = supabase.from("obra").select("orden").order("orden", { ascending: false }).limit(1);
  consulta = exposicionId
    ? consulta.eq("exposicion_id", exposicionId)
    : consulta.is("exposicion_id", null);
  const { data } = await consulta.maybeSingle();
  return (data?.orden ?? -1) + 1;
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

  const conjunto = await canonizarConjunto(
    supabase,
    campos.datos.exposicion_id,
    campos.datos.conjunto,
  );
  const subida = await subirImagen(supabase, archivo, "obras");
  if ("error" in subida) return fallo(subida.error);

  const { error } = await supabase.from("obra").insert({
    ...campos.datos,
    conjunto,
    orden: await siguienteOrden(supabase, campos.datos.exposicion_id),
    ...leerMedidas(formData),
    imagen_path: subida.path,
  });

  if (error) {
    await borrarImagen(supabase, subida.path);
    return fallo("No pudimos publicar la obra. Vuelve a intentar en un momento.");
  }

  revalidarObras();
  redirect("/admin/trabajos-recientes?aviso=obra-creada");
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

  const conjunto = await canonizarConjunto(
    supabase,
    campos.datos.exposicion_id,
    campos.datos.conjunto,
  );

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
    .update({ ...campos.datos, conjunto, ...(imagen ?? {}) })
    .eq("id", id);

  if (error) {
    if (imagen) await borrarImagen(supabase, imagen.imagen_path);
    return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");
  }

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

/** Guarda el orden de una sola exposición; el orden es posicional dentro de ella. */
export async function reordenarObras(ids: string[]): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await Promise.all(
    ids.map((id, indice) => supabase.from("obra").update({ orden: indice }).eq("id", id)),
  );

  revalidarObras();
}
