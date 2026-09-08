import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/env";
import {
  DEMO_CLASES,
  DEMO_DESTACADAS,
  DEMO_EXPOSICIONES,
  DEMO_GALERIA,
  DEMO_OBRAS,
  DEMO_SERIES,
  DEMO_SOBRE_MI,
} from "./demo";
import { CONFIGURACION_POR_DEFECTO } from "@/lib/site-config";
import type { ConfiguracionContenido, PaginaClave } from "@/types/database";
import type {
  ClasesContenido,
  Exposicion,
  MensajeRow,
  Obra,
  Serie,
  SerieConObras,
  SerieDetalle,
  SobreMiContenido,
} from "./tipos";

/**
 * Consultas del sitio y del panel.
 *
 * Mientras Supabase no esté configurado, el sitio público responde con el
 * contenido de referencia de `demo.ts` en vez de con nada: así el diseño se
 * puede revisar antes de que exista una sola foto, y el build no depende de
 * credenciales. El panel, en cambio, sigue vacío —no tendría sentido editar
 * obras que no existen— y su estado vacío explica qué falta.
 */

/** Columnas de `obra` más la serie asociada — una sola forma para toda la app. */
const SELECT_OBRA = "*, serie:serie_id (id, nombre, slug)";

// --- Series ----------------------------------------------------------------

export async function listarSeries(): Promise<Serie[]> {
  if (!supabaseConfigurado()) return DEMO_SERIES;
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
  if (!supabaseConfigurado()) return DEMO_OBRAS;
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
  if (!supabaseConfigurado()) return DEMO_GALERIA;

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

/**
 * Las últimas obras cargadas, para «Trabajos recientes». El orden es el de
 * subida —lo último que Jessica fotografió en el taller aparece primero— y no
 * el `orden` manual, que gobierna la retícula de cada serie.
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

  return (data ?? []) as unknown as Obra[];
}

/**
 * La técnica de una serie, deducida de sus piezas: la que más se repite.
 *
 * La serie no guarda técnica propia —la obra sí— así que en vez de pedirle a
 * Jessica el mismo dato dos veces, la página de serie lo lee de sus obras.
 */
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

/**
 * La página de una serie: sus obras publicadas, la técnica que comparten y la
 * exposición que la mostró, que es el enlace de vuelta.
 */
export async function obtenerSerieDetalle(slug: string): Promise<SerieDetalle | null> {
  const [series, exposiciones] = await Promise.all([listarSeries(), listarExposiciones()]);

  const serie = series.find((candidata) => candidata.slug === slug);
  if (!serie) return null;

  const obras = (await listarObrasPublicadas()).filter((obra) => obra.serie_id === serie.id);
  const exposicion = exposiciones.find((expo) => expo.serie?.id === serie.id) ?? null;

  return {
    ...serie,
    obras,
    tecnica: tecnicaDominante(obras),
    exposicion: exposicion ? { titulo: exposicion.titulo, slug: exposicion.slug } : null,
  };
}

// --- Exposiciones ----------------------------------------------------------

/** Columnas de `exposicion` con sus fotos y la serie que expuso. */
const SELECT_EXPO = "*, fotos:exposicion_foto (*), serie:serie_id (id, nombre, slug)";

function ordenarFotos(expo: Exposicion): Exposicion {
  return { ...expo, fotos: [...expo.fotos].sort((a, b) => a.orden - b.orden) };
}

export async function listarExposiciones(soloPublicadas = true): Promise<Exposicion[]> {
  if (!supabaseConfigurado()) return soloPublicadas ? DEMO_EXPOSICIONES : [];
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

/**
 * Datos de contacto y cita de portada. A diferencia de las otras páginas, acá
 * el respaldo son los valores por defecto y no un vacío: el sitio siempre
 * necesita un correo y un teléfono que mostrar.
 */
export function obtenerConfiguracion(): Promise<ConfiguracionContenido> {
  return obtenerPagina("configuracion", CONFIGURACION_POR_DEFECTO);
}
