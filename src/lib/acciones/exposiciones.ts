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
  type Resultado,
} from "./comun";
import { erroresPorCampo, exposicionSchema, slugify } from "@/lib/validacion";
import { rutaDeImagenValida } from "@/lib/subida-directa";

function revalidarExposiciones(): void {
  revalidatePath("/exposiciones");
  revalidatePath("/exposiciones/[slug]", "page");
  revalidatePath("/exposiciones/[slug]/obras", "page");
  revalidatePath("/trabajos-recientes");
  revalidatePath("/admin/exposiciones");
  revalidatePath("/admin/trabajos-recientes");
}

function leerCampos(formData: FormData) {
  const analisis = exposicionSchema.safeParse({
    titulo: String(formData.get("titulo") ?? ""),
    lugar: String(formData.get("lugar") ?? ""),
    anio: enteroONulo(formData.get("anio")),
    descripcion: String(formData.get("descripcion") ?? ""),
    publicada: booleano(formData.get("publicada")),
  });

  if (!analisis.success) return { errores: erroresPorCampo(analisis.error) } as const;

  const d = analisis.data;
  return {
    datos: {
      titulo: d.titulo,
      slug: slugify(d.titulo),
      lugar: d.lugar ? d.lugar : null,
      anio: d.anio ?? null,
      descripcion: d.descripcion ? d.descripcion : null,
      publicada: d.publicada,
    },
  } as const;
}

/** El final de la lista editorial, para nuevas exposiciones. */
async function siguienteOrden(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteConSesion>>>,
): Promise<number> {
  const { data } = await supabase
    .from("exposicion")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.orden ?? 0) + 1;
}

/**
 * Alta rápida desde el formulario de obra. La exposición nace oculta para no
 * publicar una ficha incompleta si Jessica cancela el alta de la obra.
 */
export async function crearExposicionRapida(
  titulo: string,
): Promise<{ id: string; titulo: string; slug: string } | { error: string }> {
  const limpio = titulo.trim();
  if (limpio.length < 2) return { error: "La exposición necesita un título." };

  const supabase = await clienteConSesion();
  if (!supabase) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const slug = slugify(limpio);
  const { data, error } = await supabase
    .from("exposicion")
    .insert({
      titulo: limpio,
      slug,
      publicada: false,
      orden: await siguienteOrden(supabase),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No pudimos crear la exposición. ¿Ya existe una con ese título?" };
  }

  revalidarExposiciones();
  return { id: data.id, titulo: limpio, slug };
}

/** Sube las fotos de sala nuevas y las asocia a la exposición. */
async function guardarFotos(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteConSesion>>>,
  exposicionId: string,
  formData: FormData,
  desdeOrden: number,
): Promise<string | null> {
  const cantidad = Math.min(Math.max(enteroONulo(formData.get("fotos_count")) ?? 0, 0), 200);
  if (cantidad === 0) return null;

  const fotos = [];
  for (let indice = 0; indice < cantidad; indice += 1) {
    const path = String(formData.get(`fotos_path_${indice}`) ?? "").trim();
    if (!rutaDeImagenValida(path, "exposiciones")) {
      return "Una de las fotos todavía no terminó de subir. Espera un momento y vuelve a guardar.";
    }
    const alt =
      String(formData.get(`foto_alt_${indice}`) ?? "").trim() ||
      "Vista de sala de la exposición";

    fotos.push({
      exposicion_id: exposicionId,
      imagen_path: path,
      imagen_alt: alt,
      imagen_ancho: enteroONulo(formData.get(`foto_ancho_${indice}`)),
      imagen_alto: enteroONulo(formData.get(`foto_alto_${indice}`)),
      orden: desdeOrden + indice,
    });
  }

  const { error } = await supabase.from("exposicion_foto").insert(fotos);

  if (error) {
    await Promise.all(fotos.map(({ imagen_path }) => borrarImagen(supabase, imagen_path)));
    return "No pudimos guardar una de las fotos. Vuelve a intentar.";
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
    .insert({ ...campos.datos, orden: await siguienteOrden(supabase) })
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

/** Guarda el orden editorial de la lista de exposiciones. */
export async function reordenarExposiciones(ids: string[]): Promise<void> {
  const supabase = await clienteConSesion();
  if (!supabase) return;

  await Promise.all(
    ids.map((id, indice) => supabase.from("exposicion").update({ orden: indice + 1 }).eq("id", id)),
  );

  revalidarExposiciones();
}
