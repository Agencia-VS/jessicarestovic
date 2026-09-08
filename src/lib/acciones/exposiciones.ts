"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  booleano,
  borrarImagen,
  clienteConSesion,
  enteroONulo,
  fallo,
  ok,
  SIN_SESION,
  subirImagen,
  textoONulo,
  type Cliente,
  type Resultado,
} from "./comun";
import { erroresPorCampo, exposicionSchema, slugify } from "@/lib/validacion";

function revalidarExposiciones(): void {
  revalidatePath("/exposiciones");
  // La página de cada muestra y las de serie muestran el enlace cruzado
  // («Ver la serie», «← Volúmenes»), así que se refrescan juntas.
  revalidatePath("/exposiciones/[slug]", "page");
  revalidatePath("/serie/[slug]", "page");
  revalidatePath("/admin/exposiciones");
}

function leerCampos(formData: FormData) {
  const analisis = exposicionSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    serie_id: textoONulo(formData.get("serie_id")),
    lugar: String(formData.get("lugar") ?? ""),
    anio: enteroONulo(formData.get("anio")),
    descripcion: String(formData.get("descripcion") ?? ""),
    publicada: booleano(formData.get("publicada")),
    orden: enteroONulo(formData.get("orden")) ?? 0,
  });

  if (!analisis.success) return { errores: erroresPorCampo(analisis.error) } as const;

  const d = analisis.data;
  return {
    datos: {
      titulo: d.titulo,
      slug: slugify(d.titulo),
      serie_id: d.serie_id ?? null,
      lugar: d.lugar ? d.lugar : null,
      anio: d.anio ?? null,
      descripcion: d.descripcion ? d.descripcion : null,
      publicada: d.publicada,
      orden: d.orden,
    },
  } as const;
}

/**
 * Sube las fotos de sala nuevas y las asocia a la exposición.
 * El texto alternativo de cada una llega en `foto_alt_<i>`.
 */
async function guardarFotos(
  supabase: Cliente,
  exposicionId: string,
  formData: FormData,
  desdeOrden: number,
): Promise<string | null> {
  const archivos = formData
    .getAll("fotos")
    .filter((valor): valor is File => valor instanceof File && valor.size > 0);

  if (archivos.length === 0) return null;

  for (const [indice, archivo] of archivos.entries()) {
    const subida = await subirImagen(supabase, archivo, "exposiciones");
    if ("error" in subida) return subida.error;

    const alt =
      String(formData.get(`foto_alt_${indice}`) ?? "").trim() ||
      `Vista de sala de la exposición`;

    const { error } = await supabase.from("exposicion_foto").insert({
      exposicion_id: exposicionId,
      imagen_path: subida.path,
      imagen_alt: alt,
      imagen_ancho: enteroONulo(formData.get(`foto_ancho_${indice}`)),
      imagen_alto: enteroONulo(formData.get(`foto_alto_${indice}`)),
      orden: desdeOrden + indice,
    });

    if (error) {
      await borrarImagen(supabase, subida.path);
      return "No pudimos guardar una de las fotos. Vuelve a intentar.";
    }
  }

  return null;
}

export async function crearExposicion(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const campos = leerCampos(formData);
  if ("errores" in campos) return fallo("Revisa los campos marcados.", campos.errores);

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { data, error } = await supabase
    .from("exposicion")
    .insert(campos.datos)
    .select("id")
    .single();

  if (error || !data) {
    return fallo("No pudimos crear la exposición. ¿Ya existe una con ese título?");
  }

  const problemaFotos = await guardarFotos(supabase, data.id, formData, 0);
  if (problemaFotos) return fallo(problemaFotos);

  revalidarExposiciones();
  redirect("/admin/exposiciones?aviso=exposicion-creada");
}

export async function editarExposicion(
  id: string,
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const campos = leerCampos(formData);
  if ("errores" in campos) return fallo("Revisa los campos marcados.", campos.errores);

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const { error } = await supabase.from("exposicion").update(campos.datos).eq("id", id);
  if (error) return fallo("No pudimos guardar los cambios de la exposición.");

  const { count } = await supabase
    .from("exposicion_foto")
    .select("id", { count: "exact", head: true })
    .eq("exposicion_id", id);

  const problemaFotos = await guardarFotos(supabase, id, formData, count ?? 0);
  if (problemaFotos) return fallo(problemaFotos);

  revalidarExposiciones();
  return ok("Cambios guardados.");
}

export async function eliminarExposicion(id: string): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  // Las fotos se van por cascada en la base; los archivos hay que borrarlos.
  const { data: fotos } = await supabase
    .from("exposicion_foto")
    .select("imagen_path")
    .eq("exposicion_id", id);

  const { error } = await supabase.from("exposicion").delete().eq("id", id);
  if (!error) {
    for (const { imagen_path } of fotos ?? []) await borrarImagen(supabase, imagen_path);
  }

  revalidarExposiciones();
}

export async function eliminarFoto(fotoId: string): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  const { data: foto } = await supabase
    .from("exposicion_foto")
    .select("imagen_path")
    .eq("id", fotoId)
    .maybeSingle();

  const { error } = await supabase.from("exposicion_foto").delete().eq("id", fotoId);
  if (!error && foto) await borrarImagen(supabase, foto.imagen_path);

  revalidarExposiciones();
}

export async function alternarExposicionPublicada(
  id: string,
  publicada: boolean,
): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await supabase.from("exposicion").update({ publicada }).eq("id", id);
  revalidarExposiciones();
}
