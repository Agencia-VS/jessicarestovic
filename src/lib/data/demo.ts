import type { Exposicion, FotoDeSala, Obra } from "./tipos";
import type { ClasesContenido, SobreMiContenido } from "@/types/database";
import { CELDAS_PORTADA } from "@/lib/site-config";

/**
 * Contenido de referencia para cuando todavía no hay base de datos conectada.
 *
 * La exposición es la definición primaria: sus piezas viven dentro de ella y
 * un conjunto con nombre permite conservar «Espacios Íntimos» sin convertirlo
 * en una segunda entidad. Las imágenes son bloques de color, no la obra real.
 */

const AHORA = "2026-01-01T00:00:00.000Z";

const BLOQUES = {
  cuadrado: { archivo: "ensambles-01", ancho: 1800, alto: 1800 },
  cuadradoII: { archivo: "ensambles-03", ancho: 1800, alto: 1800 },
  cuadradoIII: { archivo: "ensambles-05", ancho: 1800, alto: 1800 },
  horizontal: { archivo: "ensambles-04", ancho: 1800, alto: 1350 },
  vertical: { archivo: "ensambles-02", ancho: 1800, alto: 2250 },
  verticalII: { archivo: "ensambles-06", ancho: 1800, alto: 2250 },
  verticalIII: { archivo: "intimos-01", ancho: 1800, alto: 2250 },
  verticalIV: { archivo: "intimos-02", ancho: 1800, alto: 2250 },
  verticalV: { archivo: "intimos-03", ancho: 1800, alto: 2250 },
  retrato: { archivo: "intimos-04", ancho: 2400, alto: 3000 },
} as const;

type Bloque = keyof typeof BLOQUES;
const TODOS_LOS_BLOQUES = Object.keys(BLOQUES) as Bloque[];

interface DefinicionPieza {
  titulo: string;
  bloque: Bloque;
  conjunto?: string;
}

interface DefinicionExpo {
  slug: string;
  titulo: string;
  lugar: string | null;
  anio: number | null;
  descripcion: string | null;
  vistas: number;
  tecnica?: string;
  piezas: DefinicionPieza[];
}

/** Las siete exposiciones de la auditoría, en el orden editorial sembrado. */
const EXPOS: DefinicionExpo[] = [
  {
    slug: "fundacion-guayasamin",
    titulo: "Fundación Guayasamín",
    lugar: "Quito, Ecuador",
    anio: null,
    descripcion: "Dos obras de 1,6 × 1,6 m, óleo sobre tela.",
    vistas: 4,
    piezas: [],
  },
  {
    slug: "sur",
    titulo: "Sur",
    lugar: null,
    anio: null,
    descripcion: "Serie en grafito sobre tela inspirada en la Patagonia.",
    vistas: 7,
    tecnica: "Grafito sobre tela",
    piezas: [
      { titulo: "Sur I", bloque: "horizontal" },
      { titulo: "Sur II", bloque: "cuadrado" },
    ],
  },
  {
    slug: "ensambles-al-cubo",
    titulo: "Ensambles al cubo",
    lugar: null,
    anio: null,
    descripcion: "Muestra de la serie de ensambles en óleo sobre tela.",
    vistas: 34,
    tecnica: "Óleo sobre tela",
    piezas: [
      { titulo: "Ensambles al Cubo I", bloque: "cuadrado" },
      { titulo: "Ensambles al Cubo II", bloque: "vertical" },
      { titulo: "Ensambles al Cubo III", bloque: "cuadradoII" },
      { titulo: "Ensambles al Cubo IV", bloque: "horizontal" },
      { titulo: "Ensambles al Cubo V", bloque: "cuadradoIII" },
      { titulo: "Ensambles al Cubo VI", bloque: "verticalII" },
      { titulo: "Espacios Íntimos I", bloque: "verticalIII", conjunto: "Espacios Íntimos" },
      { titulo: "Espacios Íntimos II", bloque: "verticalIV", conjunto: "Espacios Íntimos" },
      { titulo: "Espacios Íntimos III", bloque: "verticalV", conjunto: "Espacios Íntimos" },
      { titulo: "Espacios Íntimos IV", bloque: "retrato", conjunto: "Espacios Íntimos" },
    ],
  },
  {
    slug: "de-lo-residual-y-lo-efimero",
    titulo: "De lo residual y lo efímero",
    lugar: null,
    anio: null,
    descripcion: "Huellas del tiempo sobre distintas superficies.",
    vistas: 6,
    piezas: [
      { titulo: "De lo Residual I", bloque: "horizontal" },
      { titulo: "De lo Residual II", bloque: "cuadradoII" },
      { titulo: "De lo Residual III", bloque: "verticalII" },
    ],
  },
  {
    slug: "de-lo-precario",
    titulo: "De lo precario",
    lugar: null,
    anio: null,
    descripcion: "Materiales simples y frágiles como lenguaje.",
    vistas: 21,
    piezas: [
      { titulo: "De lo Precario I", bloque: "vertical" },
      { titulo: "De lo Precario II", bloque: "cuadradoIII" },
    ],
  },
  {
    slug: "volumenes",
    titulo: "Volúmenes",
    lugar: "Feria La Porfía",
    anio: 2013,
    descripcion: "Serie expuesta en la Feria La Porfía.",
    vistas: 8,
    piezas: [
      { titulo: "Volúmenes I", bloque: "verticalIV" },
      { titulo: "Volúmenes II", bloque: "cuadrado" },
    ],
  },
  {
    slug: "a-partir-de-lo-simple",
    titulo: "A partir de lo simple",
    lugar: null,
    anio: null,
    descripcion: "Documentación de proceso: obra en curso y obra terminada.",
    vistas: 5,
    piezas: [
      { titulo: "A partir de lo simple I", bloque: "verticalV" },
      { titulo: "A partir de lo simple II", bloque: "cuadradoII" },
      { titulo: "A partir de lo simple III", bloque: "horizontal" },
    ],
  },
];

const EXPOSICIONES_BASE = EXPOS.map((expo, indice) => ({
  id: `demo-expo-${expo.slug}`,
  titulo: expo.titulo,
  slug: expo.slug,
  lugar: expo.lugar,
  anio: expo.anio,
  descripcion: expo.descripcion,
  publicada: true,
  orden: indice + 1,
  creado_en: AHORA,
  actualizado_en: AHORA,
}));

const OBRAS: Obra[] = EXPOS.flatMap((definicion, indiceExpo) => {
  const exposicion = EXPOSICIONES_BASE[indiceExpo]!;

  return definicion.piezas.map((pieza, indicePieza): Obra => {
    const bloque = BLOQUES[pieza.bloque];
    return {
      id: `demo-obra-${definicion.slug}-${indicePieza + 1}`,
      titulo: pieza.titulo,
      exposicion_id: exposicion.id,
      conjunto: pieza.conjunto ?? null,
      exposicion: {
        id: exposicion.id,
        titulo: exposicion.titulo,
        slug: exposicion.slug,
        publicada: exposicion.publicada,
      },
      anio: definicion.anio,
      tecnica: definicion.tecnica ?? null,
      dimensiones: null,
      imagen_path: `/demo/${bloque.archivo}.avif`,
      imagenUrl: `/demo/${bloque.archivo}.avif`,
      imagen_alt: `${pieza.titulo} — bloque de color de referencia, no la obra real`,
      imagen_ancho: bloque.ancho,
      imagen_alto: bloque.alto,
      destacada:
        definicion.slug === "ensambles-al-cubo" && indicePieza < CELDAS_PORTADA,
      publicada: true,
      orden: indicePieza,
      creado_en: AHORA,
      actualizado_en: AHORA,
    };
  });
});

export const DEMO_OBRAS: Obra[] = OBRAS;

export const DEMO_DESTACADAS: Obra[] = OBRAS.filter((obra) => obra.destacada);

function vistasDe(expo: DefinicionExpo, desde: number): FotoDeSala[] {
  return Array.from({ length: expo.vistas }, (_, indice) => {
    const clave = TODOS_LOS_BLOQUES[(desde + indice) % TODOS_LOS_BLOQUES.length]!;
    const bloque = BLOQUES[clave];
    return {
      id: `demo-foto-${expo.slug}-${indice + 1}`,
      exposicion_id: `demo-expo-${expo.slug}`,
      imagen_path: `/demo/${bloque.archivo}.avif`,
      imagenUrl: `/demo/${bloque.archivo}.avif`,
      imagen_alt: `Vista de montaje ${indice + 1} de ${expo.titulo} — bloque de referencia, no la sala real`,
      imagen_ancho: bloque.ancho,
      imagen_alto: bloque.alto,
      orden: indice,
      creado_en: AHORA,
    };
  });
}

export const DEMO_EXPOSICIONES: Exposicion[] = EXPOSICIONES_BASE.map((exposicion, indice) => ({
  ...exposicion,
  obrasPublicadas: OBRAS.filter(
    (obra) => obra.exposicion_id === exposicion.id && obra.publicada,
  ).length,
  fotos: vistasDe(EXPOS[indice]!, indice * 3),
}));

export const DEMO_SOBRE_MI: SobreMiContenido = {
  titulo: "Sobre mí",
  biografia:
    "Este texto es un marcador: la biografía real se carga desde el panel, en «Sobre mí».\n\n" +
    "Trabajo por conjuntos de obra. Cada uno parte de un material y una pregunta: el óleo sobre tela en " +
    "Ensambles al Cubo, el grafito en Sur y las superficies gastadas de De lo residual. La obra " +
    "se acumula despacio, en el taller, y cada conjunto se cierra cuando deja de tener algo que decir.",
  cita:
    "Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.",
  retrato_path: null,
  retrato_alt: null,
};

export const DEMO_CLASES: ClasesContenido = {
  titulo: "Clases",
  introduccion:
    "Talleres en mi taller, para un máximo de tres personas por sesión. El trabajo es individual " +
    "dentro del grupo: cada quien avanza en su propio proyecto.",
  tecnicas: [
    "Acuarela — Papel, aguadas, transparencia",
    "Monocopia — Impresión única sobre placa",
    "Dibujo — Grafito y carboncillo del natural",
  ],
  nota: "Cupos limitados: máximo 3 personas por taller.",
};
