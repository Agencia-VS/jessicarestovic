"use server";

import { revalidatePath } from "next/cache";
import {
  borrarImagen,
  clienteConSesion,
  fallo,
  ok,
  SIN_SESION,
  textoONulo,
  type Resultado,
} from "./comun";
import {
  clasesSchema,
  configuracionSchema,
  erroresPorCampo,
  sobreMiSchema,
} from "@/lib/validacion";
import { BUCKET_IMAGENES } from "@/lib/images";
import type {
  ClasesContenido,
  ConfiguracionContenido,
  SobreMiContenido,
} from "@/types/database";
import { rutaDeImagenValida } from "@/lib/subida-directa";

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

  // El retrato solo cambia si llegó una ruta firmada nueva.
  const nuevaRuta = textoONulo(formData.get("retrato_path"));
  const retratoSeleccionado = formData.get("retrato_seleccionada") === "1";
  if (retratoSeleccionado && !nuevaRuta) {
    return fallo("La foto seleccionada todavía no terminó de subir. Vuelve a intentarlo cuando llegue al 100%.");
  }
  if (nuevaRuta && !rutaDeImagenValida(nuevaRuta, "retratos")) {
    return fallo("El nuevo retrato no es válido o la subida todavía no terminó.");
  }

  if (nuevaRuta) {
    const { data: archivo, error: errorArchivo } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .info(nuevaRuta);

    if (errorArchivo || !archivo) {
      console.error("[guardarSobreMi] El retrato no está disponible en Storage", {
        path: nuevaRuta,
        error: errorArchivo,
      });
      return fallo("La foto no quedó disponible en Storage. Vuelve a subirla y espera a que termine.");
    }
  }
  let retratoPath = previo.retrato_path ?? null;
  if (nuevaRuta) retratoPath = nuevaRuta;

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
    if (nuevaRuta) await borrarImagen(supabase, nuevaRuta);
    return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");
  }

  // Recién con la página apuntando al retrato nuevo, borramos el anterior.
  if (nuevaRuta && previo.retrato_path && previo.retrato_path !== retratoPath) {
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

/** Guarda los datos de contacto y la cita de portada. */
export async function guardarConfiguracion(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = configuracionSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    cita: String(formData.get("cita") ?? ""),
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const contenido: ConfiguracionContenido = analisis.data;

  const { error } = await supabase
    .from("pagina")
    .upsert({ clave: "configuracion", contenido }, { onConflict: "clave" });

  if (error) return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");

  // El contacto aparece en el pie de todas las páginas.
  revalidatePath("/", "layout");
  return ok("Datos de contacto actualizados.");
}
