import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/entorno";
import {
  DEMO_CLASES,
  DEMO_DESTACADAS,
  DEMO_EXPOSICIONES,
  DEMO_OBRAS,
  DEMO_SOBRE_MI,
} from "./demo";
import { CONFIGURACION_POR_DEFECTO } from "@/lib/site-config";
import { urlImagen } from "@/lib/imagenes-servidor";
import type { ConfiguracionContenido, PaginaClave } from "@/types/database";
import type {
  ClasesContenido,
  Exposicion,
  ExposicionDetalle,
  FotoDeSala,
  GrupoDeObras,
  MensajeRow,
  Obra,
  SobreMiContenido,
} from "./tipos";

/**
 * Consultas del sitio y del panel.
 *
 * Mientras Supabase no esté configurado, el sitio público responde con el
 * contenido de referencia de `demo.ts`; el panel sigue vacío porque no hay
 * nada real que editar.
 */

/** Columnas de `obra` más la exposición asociada. */
const SELECT_OBRA =
  "*, exposicion:exposicion_id (id, titulo, slug, publicada)";

/** Columnas de `exposicion` y sus fotos de sala. */
const SELECT_EXPO = "*, fotos:exposicion_foto (*)";

/** Añade la URL de la foto, para que el navegador no tenga que armarla. */
function conUrl(obra: Omit<Obra, "imagenUrl">): Obra {
  return { ...obra, imagenUrl: urlImagen(obra.imagen_path) };
}

type ExposicionCruda = Omit<Exposicion, "obrasPublicadas" | "fotos"> & {
  fotos: FotoDeSala[] | null;
};

/** Deja una exposición con las fotos en el orden editorial y sus URLs listas. */
function normalizarExposicion(
  cruda: ExposicionCruda,
  obrasPublicadas = 0,
): Exposicion {
  const fotos = [...(cruda.fotos ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map((foto) => ({ ...foto, imagenUrl: urlImagen(foto.imagen_path) }));

  return { ...cruda, fotos, obrasPublicadas };
}

// --- Obras -----------------------------------------------------------------

export async function listarObrasPublicadas(): Promise<Obra[]> {
  if (!supabaseConfigurado()) return DEMO_OBRAS;
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("publicada", true)
    .order("exposicion_id", { nullsFirst: true })
    .order("orden")
    .order("creado_en");

  return ((data ?? []) as unknown as Omit<Obra, "imagenUrl">[]).map(conUrl);
}

/** Obras destacadas para el Inicio, en el orden que fijó Jessica. */
export async function listarObrasDestacadas(limite = 8): Promise<Obra[]> {
  if (!supabaseConfigurado()) return DEMO_DESTACADAS.slice(0, limite);
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("publicada", true)
    .eq("destacada", true)
    .order("orden")
    .order("creado_en")
    .limit(limite);

  return ((data ?? []) as unknown as Omit<Obra, "imagenUrl">[]).map(conUrl);
}

/** Todas las obras, publicadas u ocultas, agrupadas por exposición y orden. */
export async function listarObrasAdmin(): Promise<Obra[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .order("exposicion_id", { nullsFirst: true })
    .order("orden")
    .order("creado_en");

  return ((data ?? []) as unknown as Omit<Obra, "imagenUrl">[]).map(conUrl);
}

export async function obtenerObra(id: string): Promise<Obra | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await createClient();

  const { data } = await supabase.from("obra").select(SELECT_OBRA).eq("id", id).maybeSingle();
  return data ? conUrl(data as unknown as Omit<Obra, "imagenUrl">) : null;
}

/** Obras de una muestra para el bloque de solo lectura del panel. */
export async function listarObrasDeExposicion(exposicionId: string): Promise<Obra[]> {
  if (!supabaseConfigurado()) {
    return DEMO_OBRAS.filter((obra) => obra.exposicion_id === exposicionId);
  }
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("exposicion_id", exposicionId)
    .order("orden")
    .order("creado_en");

  return ((data ?? []) as unknown as Omit<Obra, "imagenUrl">[]).map(conUrl);
}

/**
 * Las últimas obras cargadas, para «Trabajos recientes». El orden es la fecha
 * de subida y no el orden manual de la retícula de cada exposición.
 */
export async function listarObrasRecientes(limite = 12): Promise<Obra[]> {
  if (!supabaseConfigurado()) return DEMO_OBRAS.slice(0, limite);
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("publicada", true)
    .order("creado_en", { ascending: false })
    .limit(limite);

  return ((data ?? []) as unknown as Omit<Obra, "imagenUrl">[]).map(conUrl);
}

// --- Exposiciones ----------------------------------------------------------

/** Cuenta la técnica que más se repite en un grupo de obras. */
function tecnicaDominante(obras: Obra[]): string | null {
  const cuenta = new Map<string, number>();
  for (const { tecnica } of obras) {
    if (tecnica) cuenta.set(tecnica, (cuenta.get(tecnica) ?? 0) + 1);
  }

  let dominante: string | null = null;
  let maximo = 0;
  for (const [tecnica, veces] of cuenta) {
    if (veces > maximo) {
      dominante = tecnica;
      maximo = veces;
    }
  }
  return dominante;
}

/** Agrupa sin encabezado primero y luego los conjuntos en orden de aparición. */
export function agruparPorConjunto(obras: Obra[]): GrupoDeObras[] {
  const sinConjunto: Obra[] = [];
  const grupos = new Map<string, Obra[]>();

  for (const obra of obras) {
    if (!obra.conjunto) {
      sinConjunto.push(obra);
      continue;
    }
    const grupo = grupos.get(obra.conjunto);
    if (grupo) grupo.push(obra);
    else grupos.set(obra.conjunto, [obra]);
  }

  return [
    ...(sinConjunto.length > 0 ? [{ nombre: null, obras: sinConjunto }] : []),
    ...[...grupos.entries()].map(([nombre, obras]) => ({ nombre, obras })),
  ];
}

export async function listarExposiciones(soloPublicadas = true): Promise<Exposicion[]> {
  if (!supabaseConfigurado()) return soloPublicadas ? DEMO_EXPOSICIONES : [];
  const supabase = await createClient();

  let consulta = supabase.from("exposicion").select(SELECT_EXPO);
  if (soloPublicadas) consulta = consulta.eq("publicada", true);

  const [{ data: exposiciones }, { data: obras }] = await Promise.all([
    consulta.order("orden").order("creado_en", { ascending: false }),
    supabase.from("obra").select("exposicion_id").eq("publicada", true),
  ]);

  const conteo = new Map<string, number>();
  for (const obra of obras ?? []) {
    if (obra.exposicion_id) {
      conteo.set(obra.exposicion_id, (conteo.get(obra.exposicion_id) ?? 0) + 1);
    }
  }

  return ((exposiciones ?? []) as unknown as ExposicionCruda[]).map((expo) =>
    normalizarExposicion(expo, conteo.get(expo.id) ?? 0),
  );
}

export async function obtenerExposicion(id: string): Promise<Exposicion | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await createClient();

  const [{ data }, { data: obras }] = await Promise.all([
    supabase.from("exposicion").select(SELECT_EXPO).eq("id", id).maybeSingle(),
    supabase.from("obra").select("exposicion_id").eq("exposicion_id", id).eq("publicada", true),
  ]);

  return data
    ? normalizarExposicion(
        data as unknown as ExposicionCruda,
        obras?.length ?? 0,
      )
    : null;
}

/** La exposición que pide una URL como `/exposiciones/volumenes`. */
export async function obtenerExposicionPorSlug(slug: string): Promise<Exposicion | null> {
  if (!supabaseConfigurado()) {
    return DEMO_EXPOSICIONES.find((expo) => expo.slug === slug) ?? null;
  }
  const supabase = await createClient();

  const { data } = await supabase
    .from("exposicion")
    .select(SELECT_EXPO)
    .eq("slug", slug)
    .eq("publicada", true)
    .maybeSingle();

  if (!data) return null;

  const { data: obras } = await supabase
    .from("obra")
    .select("exposicion_id")
    .eq("exposicion_id", data.id)
    .eq("publicada", true);

  return normalizarExposicion(data as unknown as ExposicionCruda, obras?.length ?? 0);
}

/** Una exposición con sus obras publicadas y el agrupado del segundo nivel. */
export async function obtenerExposicionDetalle(slug: string): Promise<ExposicionDetalle | null> {
  const exposicion = await obtenerExposicionPorSlug(slug);
  if (!exposicion) return null;

  const obras = (await listarObrasPublicadas())
    .filter((obra) => obra.exposicion_id === exposicion.id)
    .sort((a, b) => a.orden - b.orden || a.creado_en.localeCompare(b.creado_en));

  return {
    ...exposicion,
    obras,
    grupos: agruparPorConjunto(obras),
    tecnica: tecnicaDominante(obras),
  };
}

/** Conjuntos existentes, para sugerencias del datalist del panel. */
export async function listarConjuntos(exposicionId?: string): Promise<string[]> {
  if (!supabaseConfigurado()) {
    const obras = exposicionId
      ? DEMO_OBRAS.filter((obra) => obra.exposicion_id === exposicionId)
      : DEMO_OBRAS;
    return [...new Set(obras.map((obra) => obra.conjunto).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }

  const supabase = await createClient();
  let consulta = supabase.from("obra").select("conjunto").not("conjunto", "is", null);
  if (exposicionId) consulta = consulta.eq("exposicion_id", exposicionId);
  const { data } = await consulta;

  return [...new Set((data ?? []).map(({ conjunto }) => conjunto).filter(Boolean) as string[])].sort(
    (a, b) => a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

// --- Mensajes --------------------------------------------------------------

export async function listarMensajes(): Promise<MensajeRow[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const { data } = await supabase.from("mensaje").select("*").order("creado_en", { ascending: false });
  return data ?? [];
}

export async function contarMensajesSinLeer(): Promise<number> {
  if (!supabaseConfigurado()) return 0;
  const supabase = await createClient();

  const { count } = await supabase
    .from("mensaje")
    .select("id", { count: "exact", head: true })
    .eq("leido", false);

  return count ?? 0;
}

// --- Páginas de contenido --------------------------------------------------

const SOBRE_MI_VACIO: SobreMiContenido = {
  titulo: "Sobre mí",
  biografia: "",
  cita: null,
  retrato_path: null,
  retrato_alt: null,
};

const CLASES_VACIO: ClasesContenido = {
  titulo: "Clases",
  introduccion: "",
  tecnicas: [],
  nota: null,
};

async function obtenerPagina<T>(clave: PaginaClave, vacio: T): Promise<T> {
  if (!supabaseConfigurado()) return vacio;

  const supabase = await createClient();
  const { data } = await supabase
    .from("pagina")
    .select("contenido")
    .eq("clave", clave)
    .maybeSingle();

  return data?.contenido ? ({ ...vacio, ...data.contenido } as T) : vacio;
}

export function obtenerSobreMi(): Promise<SobreMiContenido> {
  return obtenerPagina("sobre-mi", supabaseConfigurado() ? SOBRE_MI_VACIO : DEMO_SOBRE_MI);
}

export function obtenerClases(): Promise<ClasesContenido> {
  return obtenerPagina("clases", supabaseConfigurado() ? CLASES_VACIO : DEMO_CLASES);
}

/** Datos de contacto y cita de portada. */
export function obtenerConfiguracion(): Promise<ConfiguracionContenido> {
  return obtenerPagina("configuracion", CONFIGURACION_POR_DEFECTO);
}
