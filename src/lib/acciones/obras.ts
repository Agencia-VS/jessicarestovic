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
  textoONulo,
  type Resultado,
} from "./comun";
import { erroresPorCampo, obraSchema, slugify } from "@/lib/validacion";
import { rutaDeImagenValida } from "@/lib/subida-directa";
import type { ObraEnLoteEntrada } from "@/lib/data/tipos";

/**
 * Rutas que dependen de las obras.
 *
 * Son las dos secciones completas porque una obra puede colgar de una muestra
 * o de un conjunto de trabajo, y el conteo de su tarjeta cambia con ella.
 */
function revalidarObras(): void {
  revalidatePath("/");
  revalidatePath("/exposiciones");
  revalidatePath("/exposiciones/[slug]", "page");
  revalidatePath("/exposiciones/[slug]/obras", "page");
  revalidatePath("/trabajos");
  revalidatePath("/trabajos/[slug]", "page");
  revalidatePath("/admin/obras");
  revalidatePath("/admin/exposiciones");
  revalidatePath("/admin/exposiciones/[id]", "page");
  revalidatePath("/admin/trabajos");
  revalidatePath("/admin/trabajos/[id]", "page");
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

  const imagenPath = textoONulo(formData.get("imagen_path"));
  if (!imagenPath || !rutaDeImagenValida(imagenPath, "obras")) {
    return fallo("Falta la foto de la obra o la subida todavía no terminó.");
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const conjunto = await canonizarConjunto(
    supabase,
    campos.datos.exposicion_id,
    campos.datos.conjunto,
  );

  const { error } = await supabase.from("obra").insert({
    ...campos.datos,
    conjunto,
    orden: await siguienteOrden(supabase, campos.datos.exposicion_id),
    ...leerMedidas(formData),
    imagen_path: imagenPath,
  });

  if (error) {
    await borrarImagen(supabase, imagenPath);
    return fallo("No pudimos publicar la obra. Vuelve a intentar en un momento.");
  }

  revalidarObras();
  redirect("/admin/obras?aviso=obra-creada");
}

/**
 * Inserta varias obras en una sola escritura. Los archivos ya están en
 * Storage: acá solo validamos metadatos, reservamos órdenes consecutivos por
 * exposición y registramos sus rutas.
 */
export async function crearObrasEnLote(
  entradas: ObraEnLoteEntrada[],
): Promise<{ ok: true; cantidad: number } | { error: string }> {
  if (!Array.isArray(entradas) || entradas.length === 0) {
    return { error: "No hay obras listas para guardar." };
  }
  if (entradas.length > 200) {
    return { error: "La carpeta es demasiado grande. Súbela en grupos de hasta 200 fotos." };
  }

  const normalizadas: Array<ObraEnLoteEntrada & { conjunto: string | null }> = [];
  for (const entrada of entradas) {
    if (
      typeof entrada.imagen_path !== "string" ||
      !rutaDeImagenValida(entrada.imagen_path, "obras")
    ) {
      return { error: "Una de las fotos no tiene una subida válida." };
    }

    const analisis = obraSchema.safeParse({
      titulo: entrada.titulo,
      exposicion_id: entrada.exposicion_id,
      conjunto: entrada.conjunto ?? "",
      anio: entrada.anio,
      tecnica: entrada.tecnica ?? "",
      dimensiones: entrada.dimensiones ?? "",
      imagen_alt: entrada.imagen_alt,
      destacada: entrada.destacada,
      publicada: entrada.publicada,
    });
    if (!analisis.success) return { error: "Revisa el título y la descripción de las obras." };

    const datos = analisis.data;
    normalizadas.push({
      ...entrada,
      titulo: datos.titulo,
      exposicion_id: datos.exposicion_id ?? null,
      conjunto: datos.conjunto ? datos.conjunto : null,
      anio: datos.anio ?? null,
      tecnica: datos.tecnica ? datos.tecnica : null,
      dimensiones: datos.dimensiones ? datos.dimensiones : null,
      imagen_alt: datos.imagen_alt,
      destacada: datos.destacada,
      publicada: datos.publicada,
    });
  }

  const supabase = await clienteConSesion();
  if (!supabase) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const rutas = normalizadas.map(({ imagen_path }) => imagen_path);
  const limpiarRutas = async () => {
    await Promise.all(rutas.map((path) => borrarImagen(supabase, path)));
  };

  const conjuntos = new Map<string, string | null>();
  for (const entrada of normalizadas) {
    if (!entrada.conjunto) continue;
    const clave = `${entrada.exposicion_id ?? "sin-exposicion"}:${slugify(entrada.conjunto)}`;
    if (!conjuntos.has(clave)) {
      conjuntos.set(
        clave,
        await canonizarConjunto(supabase, entrada.exposicion_id, entrada.conjunto),
      );
    }
  }

  const exposiciones = [...new Set(normalizadas.map(({ exposicion_id }) => exposicion_id))];
  const siguientes = new Map<string | null, number>();
  await Promise.all(
    exposiciones.map(async (exposicionId) => {
      siguientes.set(exposicionId, await siguienteOrden(supabase, exposicionId));
    }),
  );

  const filas = normalizadas.map((entrada) => {
    const claveConjunto = entrada.conjunto
      ? `${entrada.exposicion_id ?? "sin-exposicion"}:${slugify(entrada.conjunto)}`
      : null;
    const orden = siguientes.get(entrada.exposicion_id) ?? 0;
    siguientes.set(entrada.exposicion_id, orden + 1);
    return {
      titulo: entrada.titulo,
      exposicion_id: entrada.exposicion_id,
      conjunto: claveConjunto ? conjuntos.get(claveConjunto) ?? entrada.conjunto : null,
      anio: entrada.anio,
      tecnica: entrada.tecnica,
      dimensiones: entrada.dimensiones,
      imagen_alt: entrada.imagen_alt,
      imagen_path: entrada.imagen_path,
      imagen_ancho: entrada.imagen_ancho,
      imagen_alto: entrada.imagen_alto,
      destacada: entrada.destacada,
      publicada: entrada.publicada,
      orden,
    };
  });

  const { error } = await supabase.from("obra").insert(filas);
  if (error) {
    await limpiarRutas();
    return { error: "No pudimos guardar las obras. Vuelve a intentar en un momento." };
  }

  revalidarObras();
  return { ok: true, cantidad: filas.length };
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

  const imagenPath = textoONulo(formData.get("imagen_path"));
  if (imagenPath && !rutaDeImagenValida(imagenPath, "obras")) {
    return fallo("La nueva foto no es válida o la subida todavía no terminó.");
  }

  let imagen: { imagen_path: string; imagen_ancho: number | null; imagen_alto: number | null } | null =
    null;

  if (imagenPath) {
    imagen = { imagen_path: imagenPath, ...leerMedidas(formData) };
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
