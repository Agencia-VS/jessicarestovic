import type { Exposicion, Obra, Serie, SerieConObras } from "./tipos";
import type { ClasesContenido, ExposicionFotoRow, SobreMiContenido } from "@/types/database";

/**
 * Contenido de referencia para cuando todavía no hay base de datos conectada.
 *
 * Sin esto, un despliegue recién montado se ve como una sucesión de cajas
 * vacías y no se puede juzgar el diseño. Con esto se ve tal como el canvas:
 * las mismas series, las mismas exposiciones y el mismo mosaico de alturas
 * variables, con los tonos —grafito, hueso, arena y gris frío— que se usaron
 * para diseñarlo.
 *
 * Son bloques de color, no la obra de Jessica, y el pie del sitio lo dice. En
 * cuanto Supabase queda configurado, las consultas dejan de mirar acá y el
 * contenido real toma su lugar; no hay forma de que ambos convivan.
 *
 * Las series y exposiciones son las mismas siete que siembra
 * `0003_contenido_inicial.sql`, así que la vista de diseño anticipa lo que
 * Jessica verá cuando conecte la base y antes de subir una sola foto.
 */

const AHORA = "2026-01-01T00:00:00.000Z";

/**
 * Los bloques disponibles, con sus medidas reales. Cada obra declara las
 * medidas del archivo que usa: así el bloque llena su marco exacto y el
 * mosaico se ve con las alturas que tendrá con fotos de verdad.
 */
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

interface DefinicionSerie {
  slug: string;
  nombre: string;
  descripcion: string | null;
  /** Un título y un bloque por pieza. */
  piezas: [titulo: string, bloque: Bloque][];
  tecnica?: string;
  anio?: number;
}

/** Las siete series de la auditoría, con las piezas que muestra el canvas. */
const DEFINICIONES: DefinicionSerie[] = [
  {
    slug: "ensambles-al-cubo",
    nombre: "Ensambles al Cubo",
    descripcion:
      "Un trabajo obsesivo en que el tiempo y el ritmo pausado del hacer es el gestor de espacios íntimos.",
    tecnica: "Óleo sobre tela",
    piezas: [
      ["Ensambles al Cubo I", "cuadrado"],
      ["Ensambles al Cubo II", "vertical"],
      ["Ensambles al Cubo III", "cuadradoII"],
      ["Ensambles al Cubo IV", "horizontal"],
      ["Ensambles al Cubo V", "cuadradoIII"],
      ["Ensambles al Cubo VI", "verticalII"],
    ],
  },
  {
    slug: "espacios-intimos",
    nombre: "Espacios Íntimos",
    descripcion: "Series pequeñas, hechas para mirarse de cerca.",
    tecnica: "Grafito sobre tela",
    piezas: [
      ["Espacios Íntimos I", "verticalIII"],
      ["Espacios Íntimos II", "verticalIV"],
      ["Espacios Íntimos III", "verticalV"],
      ["Espacios Íntimos IV", "retrato"],
    ],
  },
  {
    slug: "sur",
    nombre: "Sur",
    descripcion: "Serie en grafito sobre tela inspirada en la Patagonia.",
    tecnica: "Grafito sobre tela",
    piezas: [
      ["Sur I", "horizontal"],
      ["Sur II", "cuadrado"],
    ],
  },
  {
    slug: "de-lo-residual",
    nombre: "De lo Residual",
    descripcion: "Huellas del tiempo sobre distintas superficies.",
    piezas: [
      ["De lo Residual I", "horizontal"],
      ["De lo Residual II", "cuadradoII"],
      ["De lo Residual III", "verticalII"],
    ],
  },
  {
    slug: "de-lo-precario",
    nombre: "De lo Precario",
    descripcion: "Materiales simples y frágiles como lenguaje.",
    piezas: [
      ["De lo Precario I", "vertical"],
      ["De lo Precario II", "cuadradoIII"],
    ],
  },
  {
    slug: "volumenes",
    nombre: "Volúmenes",
    descripcion: "Serie expuesta en la Feria La Porfía, 2013.",
    anio: 2013,
    piezas: [
      ["Volúmenes I", "verticalIV"],
      ["Volúmenes II", "cuadrado"],
    ],
  },
  {
    slug: "a-partir-de-lo-simple",
    nombre: "A partir de lo simple",
    descripcion: "Documentación de proceso: obra en curso y obra terminada.",
    piezas: [
      ["A partir de lo simple I", "verticalV"],
      ["A partir de lo simple II", "cuadradoII"],
      ["A partir de lo simple III", "horizontal"],
    ],
  },
];

const SERIES: Serie[] = DEFINICIONES.map((definicion, indice) => ({
  id: `demo-serie-${definicion.slug}`,
  nombre: definicion.nombre,
  slug: definicion.slug,
  descripcion: definicion.descripcion,
  orden: indice + 1,
  creado_en: AHORA,
  actualizado_en: AHORA,
  obrasPublicadas: definicion.piezas.length,
}));

/** Las obras de todas las series, en el orden en que se muestran. */
const OBRAS: Obra[] = DEFINICIONES.flatMap((definicion, indiceSerie) => {
  const serie = SERIES[indiceSerie]!;

  return definicion.piezas.map(([titulo, clave], indicePieza): Obra => {
    const bloque = BLOQUES[clave];

    return {
      id: `demo-obra-${definicion.slug}-${indicePieza + 1}`,
      titulo,
      serie_id: serie.id,
      serie: { id: serie.id, nombre: serie.nombre, slug: serie.slug },
      anio: definicion.anio ?? null,
      tecnica: definicion.tecnica ?? null,
      dimensiones: null,
      imagen_path: `/demo/${bloque.archivo}.avif`,
      imagen_alt: `${titulo} — bloque de color de referencia, no la obra real`,
      imagen_ancho: bloque.ancho,
      imagen_alto: bloque.alto,
      // La portada del Inicio: una sola, horizontal, como pide la spec (§08).
      destacada: definicion.slug === "ensambles-al-cubo" && indicePieza === 3,
      publicada: true,
      orden: indicePieza,
      creado_en: AHORA,
      actualizado_en: AHORA,
    };
  });
});

export const DEMO_SERIES: Serie[] = SERIES;

export const DEMO_OBRAS: Obra[] = OBRAS;

export const DEMO_DESTACADAS: Obra[] = OBRAS.filter((obra) => obra.destacada);

export const DEMO_GALERIA: SerieConObras[] = SERIES.map((serie) => ({
  ...serie,
  obras: OBRAS.filter((obra) => obra.serie_id === serie.id),
}));

interface DefinicionExpo {
  slug: string;
  titulo: string;
  lugar: string | null;
  anio: number | null;
  descripcion: string | null;
  /** Cuántas vistas de sala tiene la muestra, según los números de Jessica. */
  vistas: number;
  /** La serie que expuso, cuando fue una sola. */
  serie?: string;
}

/**
 * Las siete exposiciones de la auditoría, con el número de imágenes que
 * Jessica contó para cada una.
 */
const EXPOS: DefinicionExpo[] = [
  {
    slug: "ensambles-al-cubo",
    titulo: "Ensambles al cubo",
    lugar: null,
    anio: null,
    descripcion: "Muestra de la serie de ensambles en óleo sobre tela.",
    vistas: 34,
    serie: "ensambles-al-cubo",
  },
  {
    slug: "de-lo-precario",
    titulo: "De lo precario",
    lugar: null,
    anio: null,
    descripcion: "Materiales simples y frágiles como lenguaje.",
    vistas: 21,
    serie: "de-lo-precario",
  },
  {
    slug: "volumenes",
    titulo: "Volúmenes",
    lugar: "Feria La Porfía",
    anio: 2013,
    descripcion: "Serie expuesta en la Feria La Porfía.",
    vistas: 8,
    serie: "volumenes",
  },
  {
    slug: "sur",
    titulo: "Sur",
    lugar: null,
    anio: null,
    descripcion: "Serie en grafito sobre tela inspirada en la Patagonia.",
    vistas: 7,
    serie: "sur",
  },
  {
    slug: "de-lo-residual-y-lo-efimero",
    titulo: "De lo residual y lo efímero",
    lugar: null,
    anio: null,
    descripcion: "Huellas del tiempo sobre distintas superficies.",
    vistas: 6,
    serie: "de-lo-residual",
  },
  {
    slug: "a-partir-de-lo-simple",
    titulo: "A partir de lo simple",
    lugar: null,
    anio: null,
    descripcion: "Documentación de proceso: obra en curso y obra terminada.",
    vistas: 5,
    serie: "a-partir-de-lo-simple",
  },
  {
    slug: "fundacion-guayasamin",
    titulo: "Fundación Guayasamín",
    lugar: "Quito, Ecuador",
    anio: null,
    descripcion: "Dos obras de 1,6 × 1,6 m, óleo sobre tela.",
    vistas: 4,
  },
];

/**
 * Vistas de sala de referencia: los mismos bloques, rotando. El ciclo arranca
 * corrido en cada muestra para que las portadas no salgan todas con la misma
 * proporción y el mosaico se vea como se va a ver con fotos de verdad.
 */
function vistasDe(expo: DefinicionExpo, desde: number): ExposicionFotoRow[] {
  return Array.from({ length: expo.vistas }, (_, indice) => {
    const clave = TODOS_LOS_BLOQUES[(desde + indice) % TODOS_LOS_BLOQUES.length]!;
    const bloque = BLOQUES[clave];

    return {
      id: `demo-foto-${expo.slug}-${indice + 1}`,
      exposicion_id: `demo-expo-${expo.slug}`,
      imagen_path: `/demo/${bloque.archivo}.avif`,
      imagen_alt: `Vista de montaje ${indice + 1} de ${expo.titulo} — bloque de referencia, no la sala real`,
      imagen_ancho: bloque.ancho,
      imagen_alto: bloque.alto,
      orden: indice,
      creado_en: AHORA,
    };
  });
}

export const DEMO_EXPOSICIONES: Exposicion[] = EXPOS.map((expo, indice) => {
  const serie = expo.serie ? SERIES.find((s) => s.slug === expo.serie) : undefined;

  return {
    id: `demo-expo-${expo.slug}`,
    titulo: expo.titulo,
    slug: expo.slug,
    lugar: expo.lugar,
    anio: expo.anio,
    descripcion: expo.descripcion,
    serie_id: serie?.id ?? null,
    serie: serie ? { id: serie.id, nombre: serie.nombre, slug: serie.slug } : null,
    publicada: true,
    orden: indice,
    creado_en: AHORA,
    actualizado_en: AHORA,
    fotos: vistasDe(expo, indice * 3),
  };
});

export const DEMO_SOBRE_MI: SobreMiContenido = {
  titulo: "Sobre mí",
  biografia:
    "Este texto es un marcador: la biografía real se carga desde el panel, en «Sobre mí».\n\n" +
    "Trabajo por series. Cada una parte de un material y una pregunta: el óleo sobre tela en " +
    "Ensambles al Cubo, el grafito en Sur, las superficies gastadas de De lo Residual. La obra " +
    "se acumula despacio, en el taller, y las series se cierran cuando dejan de tener algo que decir.",
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
