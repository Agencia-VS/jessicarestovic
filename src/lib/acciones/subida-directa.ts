"use server";

import { BUCKET_IMAGENES, ESPECS_IMAGEN, type TipoImagen } from "@/lib/images";
import { rutaDeImagenValida, type CarpetaImagen } from "@/lib/subida-directa";
import { borrarImagen, clienteConSesion } from "./comun";

const CARPETAS: Record<TipoImagen, CarpetaImagen> = {
  obra: "obras",
  destacada: "portadas",
  retrato: "retratos",
  exposicion: "exposiciones",
};

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function tipoValido(tipo: unknown): tipo is TipoImagen {
  return typeof tipo === "string" && tipo in ESPECS_IMAGEN;
}

/** Firma una ruta corta: la foto nunca atraviesa una Server Action. */
export async function prepararSubidaImagen(
  tipo: TipoImagen,
  contentType: string,
  sizeBytes: number,
): Promise<{ url: string; path: string } | { error: string }> {
  if (!tipoValido(tipo)) return { error: "El tipo de foto no es válido." };

  const spec = ESPECS_IMAGEN[tipo];
  const extension = EXTENSIONES[contentType];
  if (!extension || !(spec.formatos as readonly string[]).includes(contentType)) {
    return { error: "Ese archivo no es una foto que podamos usar. Sube un JPG, PNG, WebP o AVIF." };
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > spec.pesoMaxBytes) {
    return {
      error: `La foto supera el máximo de ${Math.round(spec.pesoMaxBytes / (1024 * 1024))} MB. Prueba con una versión más liviana.`,
    };
  }

  const supabase = await clienteConSesion();
  if (!supabase) return { error: "Tu sesión expiró. Vuelve a entrar." };

  const carpeta = CARPETAS[tipo];
  const path = `${carpeta}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data) {
    return { error: "No pudimos preparar la subida. Vuelve a intentar en un momento." };
  }

  return { url: data.signedUrl, path: data.path };
}

/** Limpia una subida directa que quedó sin asociar por una cancelación. */
export async function borrarSubidaPendiente(
  path: string,
  tipo: TipoImagen,
): Promise<void> {
  if (!tipoValido(tipo) || !rutaDeImagenValida(path, CARPETAS[tipo])) return;
  const supabase = await clienteConSesion();
  if (supabase) await borrarImagen(supabase, path);
}
