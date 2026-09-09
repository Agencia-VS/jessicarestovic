"use server";

import { revalidatePath } from "next/cache";
import {
  borrarImagen,
  clienteConSesion,
  enteroONulo,
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
  portadaSchema,
  sobreMiSchema,
} from "@/lib/validacion";
import {
  campoPortada,
  CELDAS_PORTADA,
  CONFIGURACION_POR_DEFECTO,
  normalizarPortadas,
} from "@/lib/site-config";
import { BUCKET_IMAGENES } from "@/lib/images";
import type {
  ClasesContenido,
  ConfiguracionContenido,
  ImagenPortada,
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

async function configuracionActual(
  supabase: NonNullable<Awaited<ReturnType<typeof clienteConSesion>>>,
): Promise<ConfiguracionContenido> {
  const { data } = await supabase
    .from("pagina")
    .select("contenido")
    .eq("clave", "configuracion")
    .maybeSingle();

  const contenido: ConfiguracionContenido = {
    ...CONFIGURACION_POR_DEFECTO,
    ...((data?.contenido ?? {}) as Partial<ConfiguracionContenido>),
  };

  // Se normaliza también al leer para escribir: así el documento con la forma
  // anterior —una sola portada en claves planas— queda con la forma nueva en el
  // primer guardado, en vez de arrastrar las dos.
  return { ...contenido, portadas: normalizarPortadas(contenido) };
}

/**
 * Arma el documento con exactamente las claves que hoy existen.
 *
 * Es deliberado que no sea un `{ ...crudo, ...cambios }`: así las claves
 * planas de la portada antigua desaparecen en el primer guardado en vez de
 * quedar para siempre en el JSON.
 */
function documentoConfiguracion(
  previo: ConfiguracionContenido,
  cambios: Partial<ConfiguracionContenido>,
): ConfiguracionContenido {
  const { email, telefono, instagram, cita, portadas } = { ...previo, ...cambios };
  return { email, telefono, instagram, cita, portadas };
}

/** Guarda los datos de contacto sin tocar la portada. */
export async function guardarConfiguracion(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = configuracionSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const previo = await configuracionActual(supabase);

  const { error } = await supabase
    .from("pagina")
    .upsert(
      { clave: "configuracion", contenido: documentoConfiguracion(previo, analisis.data) },
      { onConflict: "clave" },
    );

  if (error) return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");

  // El contacto aparece en el pie de todas las páginas.
  revalidatePath("/", "layout");
  return ok("Datos de contacto actualizados.");
}

/**
 * Guarda las fotos y la frase que encabezan el Inicio.
 *
 * Las celdas se recorren en orden y el resultado queda compacto: si Jessica
 * quita la primera de tres, las otras dos corren a la izquierda y el tríptico
 * pasa a ser un díptico. Es la forma que menos sorprende, porque el
 * formulario dibuja las celdas leyendo esa misma lista.
 */
export async function guardarPortada(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const analisis = portadaSchema.safeParse({
    cita: String(formData.get("cita") ?? ""),
    alts: Array.from({ length: CELDAS_PORTADA }, (_, indice) =>
      String(formData.get(`${campoPortada(indice)}_alt`) ?? ""),
    ),
  });

  if (!analisis.success) {
    return fallo("Revisa los campos marcados.", erroresPorCampo(analisis.error));
  }

  const supabase = await clienteConSesion();
  if (!supabase) return SIN_SESION;

  const previo = await configuracionActual(supabase);
  const { cita, alts } = analisis.data;

  const portadas: ImagenPortada[] = [];
  /** Las que se acaban de subir: se borran si el guardado falla. */
  const rutasNuevas: string[] = [];
  /** Las que dejan de estar referenciadas: se borran recién si el guardado sale bien. */
  const rutasQueSalen: string[] = [];

  for (let indice = 0; indice < CELDAS_PORTADA; indice += 1) {
    const campo = campoPortada(indice);
    const posicion = indice + 1;
    const anterior = previo.portadas[indice] ?? null;
    const nuevaRuta = textoONulo(formData.get(`${campo}_path`));

    if (formData.get(`${campo}_seleccionada`) === "1" && !nuevaRuta) {
      return fallo(
        `La foto ${posicion} todavía no terminó de subir. Espera a que llegue al 100%.`,
      );
    }
    if (nuevaRuta && !rutaDeImagenValida(nuevaRuta, "portadas")) {
      return fallo(`La foto ${posicion} no es válida o la subida todavía no terminó.`);
    }
    if (nuevaRuta) {
      const { data: archivo, error: errorArchivo } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .info(nuevaRuta);

      if (errorArchivo || !archivo) {
        return fallo(
          `La foto ${posicion} no quedó disponible en Storage. Vuelve a subirla.`,
        );
      }
    }

    // «Quitar» gana sobre conservar, pero no sobre una foto nueva: si eligió
    // otra y además dejó marcada la casilla, lo que quiso fue reemplazarla.
    if (!nuevaRuta && formData.get(`${campo}_quitar`) === "on") {
      if (anterior) rutasQueSalen.push(anterior.path);
      continue;
    }

    const path = nuevaRuta ?? anterior?.path ?? null;
    if (!path) continue;

    if (nuevaRuta) {
      rutasNuevas.push(nuevaRuta);
      if (anterior && anterior.path !== nuevaRuta) rutasQueSalen.push(anterior.path);
    }

    portadas.push({
      path,
      alt: alts[indice] || null,
      ancho: nuevaRuta ? enteroONulo(formData.get(`${campo}_ancho`)) : (anterior?.ancho ?? null),
      alto: nuevaRuta ? enteroONulo(formData.get(`${campo}_alto`)) : (anterior?.alto ?? null),
    });
  }

  const { error } = await supabase
    .from("pagina")
    .upsert(
      { clave: "configuracion", contenido: documentoConfiguracion(previo, { cita, portadas }) },
      { onConflict: "clave" },
    );

  if (error) {
    for (const ruta of rutasNuevas) await borrarImagen(supabase, ruta);
    return fallo("No pudimos guardar los cambios. Vuelve a intentar en un momento.");
  }

  for (const ruta of rutasQueSalen) await borrarImagen(supabase, ruta);

  revalidatePath("/");
  revalidatePath("/admin/inicio");
  return ok("Portada actualizada.");
}
