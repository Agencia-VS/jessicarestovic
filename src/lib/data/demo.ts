import type { Exposicion, Obra, Serie, SerieConObras } from "./tipos";
import type { ClasesContenido, SobreMiContenido } from "@/types/database";

/**
 * Contenido de referencia para cuando todavía no hay base de datos conectada.
 *
 * Sin esto, un despliegue recién montado se ve como una sucesión de cajas
 * vacías y no se puede juzgar el diseño. Con esto, se ve tal como el canvas:
 * las mismas series, las mismas proporciones y los mismos tonos —grafito,
 * hueso, arena y gris frío— que se usaron para diseñarlo.
 *
 * Son bloques de color, no la obra de Jessica. En cuanto Supabase queda
 * configurado, las consultas dejan de mirar acá y el contenido real toma su
 * lugar; no hay forma de que estos datos convivan con los suyos.
 */

const AHORA = "2026-01-01T00:00:00.000Z";

function serie(id: string, nombre: string, slug: string, descripcion: string | null, orden: number): Serie {
  return { id, nombre, slug, descripcion, orden, creado_en: AHORA, actualizado_en: AHORA, obrasPublicadas: 0 };
}

const SERIES: Serie[] = [
  serie("demo-ensambles", "Ensambles al Cubo", "ensambles-al-cubo", null, 1),
  serie("demo-intimos", "Espacios Íntimos", "espacios-intimos", "Grafito sobre tela.", 2),
];

interface Bloque {
  archivo: string;
  titulo: string;
  serie: Serie;
  ancho: number;
  alto: number;
  destacada?: boolean;
  tecnica?: string;
}

const [ENSAMBLES, INTIMOS] = SERIES as [Serie, Serie];

const BLOQUES: Bloque[] = [
  { archivo: "ensambles-01", titulo: "Ensambles al Cubo I", serie: ENSAMBLES, ancho: 1800, alto: 1800 },
  { archivo: "ensambles-02", titulo: "Ensambles al Cubo II", serie: ENSAMBLES, ancho: 1800, alto: 2250 },
  { archivo: "ensambles-03", titulo: "Ensambles al Cubo III", serie: ENSAMBLES, ancho: 1800, alto: 1800 },
  { archivo: "ensambles-04", titulo: "Ensambles al Cubo IV", serie: ENSAMBLES, ancho: 1800, alto: 1350 },
  { archivo: "ensambles-05", titulo: "Ensambles al Cubo V", serie: ENSAMBLES, ancho: 1800, alto: 1800 },
  { archivo: "ensambles-06", titulo: "Ensambles al Cubo VI", serie: ENSAMBLES, ancho: 1800, alto: 2250 },
  { archivo: "intimos-01", titulo: "Espacios Íntimos I", serie: INTIMOS, ancho: 1800, alto: 2250, tecnica: "Grafito sobre tela" },
  { archivo: "intimos-02", titulo: "Espacios Íntimos II", serie: INTIMOS, ancho: 1800, alto: 2250, tecnica: "Grafito sobre tela" },
  { archivo: "intimos-03", titulo: "Espacios Íntimos III", serie: INTIMOS, ancho: 1800, alto: 2250, tecnica: "Grafito sobre tela" },
  {
    archivo: "intimos-04",
    titulo: "Espacios Íntimos IV",
    serie: INTIMOS,
    ancho: 2400,
    alto: 3000,
    destacada: true,
    tecnica: "Grafito sobre tela",
  },
];

const OBRAS: Obra[] = BLOQUES.map((bloque, indice) => ({
  id: `demo-${bloque.archivo}`,
  titulo: bloque.titulo,
  serie_id: bloque.serie.id,
  serie: { id: bloque.serie.id, nombre: bloque.serie.nombre, slug: bloque.serie.slug },
  anio: null,
  tecnica: bloque.tecnica ?? null,
  dimensiones: null,
  imagen_path: `/demo/${bloque.archivo}.avif`,
  imagen_alt: `${bloque.titulo} — bloque de color de referencia, no la obra real`,
  imagen_ancho: bloque.ancho,
  imagen_alto: bloque.alto,
  destacada: bloque.destacada ?? false,
  publicada: true,
  orden: indice,
  creado_en: AHORA,
  actualizado_en: AHORA,
}));

function conteo(serieId: string): number {
  return OBRAS.filter((obra) => obra.serie_id === serieId).length;
}

export const DEMO_SERIES: Serie[] = SERIES.map((s) => ({ ...s, obrasPublicadas: conteo(s.id) }));

export const DEMO_OBRAS: Obra[] = OBRAS;

export const DEMO_DESTACADAS: Obra[] = OBRAS.filter((obra) => obra.destacada);

export const DEMO_GALERIA: SerieConObras[] = DEMO_SERIES.map((s) => ({
  ...s,
  obras: OBRAS.filter((obra) => obra.serie_id === s.id),
}));

/** Las exposiciones reales de la auditoría, sin fotos de sala. */
export const DEMO_EXPOSICIONES: Exposicion[] = [
  ["Fundación Guayasamín", "fundacion-guayasamin", "Quito, Ecuador", null, "Dos obras de 1,6 × 1,6 m, óleo sobre tela."],
  ["Volúmenes", "volumenes", "Feria La Porfía", 2013, null],
  ["Sur", "sur", null, null, "Serie en grafito sobre tela inspirada en la Patagonia."],
  ["Ensambles al Cubo", "ensambles-al-cubo", null, null, null],
  ["De lo residual y lo efímero", "de-lo-residual-y-lo-efimero", null, null, "Huellas del tiempo sobre distintas superficies."],
  ["De lo precario", "de-lo-precario", null, null, "Materiales simples y frágiles como lenguaje."],
  ["A partir de lo simple", "a-partir-de-lo-simple", null, null, "Documentación de proceso: obra en curso y obra terminada."],
].map(([titulo, slug, lugar, anio, descripcion], indice) => ({
  id: `demo-expo-${slug as string}`,
  titulo: titulo as string,
  slug: slug as string,
  lugar: lugar as string | null,
  anio: anio as number | null,
  descripcion: descripcion as string | null,
  publicada: true,
  orden: indice,
  creado_en: AHORA,
  actualizado_en: AHORA,
  fotos: [],
}));

export const DEMO_SOBRE_MI: SobreMiContenido = {
  titulo: "Sobre mí",
  biografia:
    "Este texto es un marcador: la biografía real se carga desde el panel, en «Sobre mí».\n\n" +
    "Trabajo con grafito, óleo y materiales encontrados. Las series nacen de la repetición y del " +
    "tiempo: cada pieza es una capa más sobre la anterior.",
  cita:
    "Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.",
  retrato_path: null,
  retrato_alt: null,
};

export const DEMO_CLASES: ClasesContenido = {
  titulo: "Clases",
  introduccion:
    "Talleres en mi taller, en grupos de máximo tres personas. Escríbeme y conversamos qué te interesa aprender.",
  tecnicas: ["Acuarela", "Monocopia", "Dibujo"],
  nota: "Cupos limitados: máximo 3 personas por taller.",
};
