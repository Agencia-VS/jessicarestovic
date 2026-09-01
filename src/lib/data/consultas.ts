import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import type {
  ClasesContenido,
  Exposicion,
  MensajeRow,
  Obra,
  Serie,
  SerieConObras,
  SobreMiContenido,
} from "./tipos";

/**
 * Consultas del sitio y del panel.
 *
 * Todas toleran que Supabase no esté configurado todavía: devuelven vacío en
 * vez de lanzar, para que el sitio muestre su estado vacío durante el montaje
 * inicial y el build no dependa de credenciales.
 */

/** Columnas de `obra` más la serie asociada — una sola forma para toda la app. */
const SELECT_OBRA = "*, serie:serie_id (id, nombre, slug)";

// --- Series ----------------------------------------------------------------

export async function listarSeries(): Promise<Serie[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const [{ data: series }, { data: obras }] = await Promise.all([
    supabase.from("serie").select("*").order("orden").order("nombre"),
    supabase.from("obra").select("serie_id").eq("publicada", true),
  ]);

  const conteo = new Map<string, number>();
  for (const { serie_id } of obras ?? []) {
    if (serie_id) conteo.set(serie_id, (conteo.get(serie_id) ?? 0) + 1);
  }

  return (series ?? []).map((serie) => ({
    ...serie,
    obrasPublicadas: conteo.get(serie.id) ?? 0,
  }));
}

// --- Obras -----------------------------------------------------------------

export async function listarObrasPublicadas(): Promise<Obra[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("publicada", true)
    .order("orden")
    .order("creado_en");

  return (data ?? []) as unknown as Obra[];
}

/** Obras destacadas para el Inicio, en el orden que fijó Jessica. */
export async function listarObrasDestacadas(limite = 8): Promise<Obra[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .eq("publicada", true)
    .eq("destacada", true)
    .order("orden")
    .order("creado_en")
    .limit(limite);

  return (data ?? []) as unknown as Obra[];
}

/** Todas las obras, publicadas u ocultas — para la grilla del panel. */
export async function listarObrasAdmin(): Promise<Obra[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("obra")
    .select(SELECT_OBRA)
    .order("orden")
    .order("creado_en");

  return (data ?? []) as unknown as Obra[];
}

export async function obtenerObra(id: string): Promise<Obra | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await createClient();

  const { data } = await supabase.from("obra").select(SELECT_OBRA).eq("id", id).maybeSingle();
  return (data as unknown as Obra) ?? null;
}

/**
 * Galería agrupada por serie, en el orden de las series. Las obras sin serie
 * caen al final bajo «Otras obras» — el caso de `/projectos-anteriores` del
 * sitio actual.
 */
export async function listarGaleriaPorSerie(): Promise<SerieConObras[]> {
  const [series, obras] = await Promise.all([listarSeries(), listarObrasPublicadas()]);

  const porSerie = new Map<string, Obra[]>();
  const sinSerie: Obra[] = [];

  for (const obra of obras) {
    if (!obra.serie_id) {
      sinSerie.push(obra);
      continue;
    }
    const lista = porSerie.get(obra.serie_id);
    if (lista) lista.push(obra);
    else porSerie.set(obra.serie_id, [obra]);
  }

  const grupos: SerieConObras[] = series
    .map((serie) => ({ ...serie, obras: porSerie.get(serie.id) ?? [] }))
    .filter((grupo) => grupo.obras.length > 0);

  if (sinSerie.length > 0) {
    grupos.push({
      id: "sin-serie",
      nombre: "Otras obras",
      slug: "otras-obras",
      descripcion: null,
      orden: Number.MAX_SAFE_INTEGER,
      creado_en: "",
      actualizado_en: "",
      obrasPublicadas: sinSerie.length,
      obras: sinSerie,
    });
  }

  return grupos;
}

// --- Exposiciones ----------------------------------------------------------

/** Columnas de `exposicion` con sus fotos. */
const SELECT_EXPO = "*, fotos:exposicion_foto (*)";

function ordenarFotos(expo: Exposicion): Exposicion {
  return { ...expo, fotos: [...expo.fotos].sort((a, b) => a.orden - b.orden) };
}

export async function listarExposiciones(soloPublicadas = true): Promise<Exposicion[]> {
  if (!supabaseConfigurado()) return [];
  const supabase = await createClient();

  let consulta = supabase.from("exposicion").select(SELECT_EXPO);
  if (soloPublicadas) consulta = consulta.eq("publicada", true);

  const { data } = await consulta
    .order("anio", { ascending: false, nullsFirst: false })
    .order("orden");

  return ((data ?? []) as unknown as Exposicion[]).map(ordenarFotos);
}

export async function obtenerExposicion(id: string): Promise<Exposicion | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await createClient();

  const { data } = await supabase.from("exposicion").select(SELECT_EXPO).eq("id", id).maybeSingle();
  return data ? ordenarFotos(data as unknown as Exposicion) : null;
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

async function obtenerPagina<T>(clave: "sobre-mi" | "clases", vacio: T): Promise<T> {
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
  return obtenerPagina("sobre-mi", SOBRE_MI_VACIO);
}

export function obtenerClases(): Promise<ClasesContenido> {
  return obtenerPagina("clases", CLASES_VACIO);
}
