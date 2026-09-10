import { headers } from "next/headers";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasAdmin } from "@/lib/data/consultas";
import { clienteConSesion, type Cliente } from "@/lib/acciones/comun";
import { BUCKET_IMAGENES } from "@/lib/images";
import { hostDe } from "@/lib/url";

export const metadata = { title: "Diagnóstico" };

/**
 * Por qué existe esta página.
 *
 * Cuando una foto no se ve, el síntoma es siempre el mismo —aparece el texto
 * alternativo— pero la causa puede estar en tres lugares muy distintos: la
 * variable de entorno, el archivo en Storage, o el optimizador de imágenes de
 * la plataforma. Desde fuera no se distinguen, y averiguarlo a distancia toma
 * varias vueltas.
 *
 * Esta página hace las tres preguntas de una vez, sobre fotos reales y desde el
 * propio despliegue, y dice cuál falla. Vive dentro del panel, así que pide
 * sesión; no muestra ninguna clave.
 *
 * Una lección aprendida a costa de varias vueltas: la versión anterior probaba
 * el optimizador contra «la primera foto» y rotulaba cualquier 400 como un
 * problema de `remotePatterns`. Cuando justo esa foto era una de las que no
 * tenía archivo, la página afirmaba con seguridad una causa equivocada. Ahora
 * el orden es el correcto: primero se averigua de qué fotos falta el archivo, y
 * el optimizador se prueba con una que sí lo tenga.
 */

interface Prueba {
  nombre: string;
  ok: boolean | null;
  detalle: string;
}

const TIEMPO_MAXIMO = 12_000;

/** La carpeta del bucket donde viven las fotos de obra. */
const CARPETA_OBRAS = "obras";

/** Lo que devuelve `list` de una vez; se pagina hasta agotar la carpeta. */
const POR_PAGINA = 1000;

/** El origen que el navegador está usando, que puede no ser `SITE_URL`. */
async function origenActual(): Promise<string> {
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo = cabeceras.get("x-forwarded-proto") ?? "https";
  return host ? `${protocolo}://${host}` : "";
}

/** Pide una URL y devuelve solo su estado, sin descargar el cuerpo completo. */
async function estadoDe(url: string): Promise<string> {
  try {
    const respuesta = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_MAXIMO),
      headers: { range: "bytes=0-0" },
    });
    const tipo = respuesta.headers.get("content-type") ?? "sin tipo";
    return `HTTP ${respuesta.status} · ${tipo}`;
  } catch (error) {
    return error instanceof Error ? `no se pudo pedir: ${error.message}` : "no se pudo pedir";
  }
}

/**
 * Todas las rutas que existen de verdad en la carpeta de obras.
 *
 * Un solo listado paginado en vez de una consulta por foto: con cincuenta obras
 * son cincuenta idas y vueltas contra una, y el dato que interesa —si el
 * archivo está o no— es el mismo. Devuelve `null` si el listado falla, para no
 * acusar de ausente a un archivo que sí puede estar.
 */
async function rutasEnStorage(supabase: Cliente): Promise<Set<string> | null> {
  const rutas = new Set<string>();
  let desde = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .list(CARPETA_OBRAS, { limit: POR_PAGINA, offset: desde });

    if (error || !data) return null;
    for (const archivo of data) rutas.add(`${CARPETA_OBRAS}/${archivo.name}`);
    if (data.length < POR_PAGINA) return rutas;
    desde += data.length;
  }
}

export default async function DiagnosticoPage() {
  const url = process.env.SUPABASE_URL;
  const host = hostDe(url);
  const pruebas: Prueba[] = [
    {
      nombre: "SUPABASE_URL se interpreta como URL",
      ok: Boolean(host),
      detalle: host
        ? `host: ${host}`
        : url
          ? "la variable existe pero no se pudo interpretar; se espera https://<ref>.supabase.co"
          : "la variable no llega al servidor",
    },
    {
      nombre: "SUPABASE_ANON_KEY llega al servidor",
      ok: Boolean(process.env.SUPABASE_ANON_KEY?.trim()),
      detalle: process.env.SUPABASE_ANON_KEY?.trim()
        ? "presente (no se muestra)"
        : "falta: sin ella el sitio usa el contenido de referencia",
    },
  ];

  const hostDelBuild = process.env.HOST_IMAGENES_DEL_BUILD;
  pruebas.push({
    nombre: "El build conocía el host de Supabase",
    ok: Boolean(hostDelBuild),
    detalle: hostDelBuild
      ? `${hostDelBuild} — el optimizador de imágenes tiene el patrón exacto`
      : "no lo conocía. El optimizador solo tiene el patrón genérico «*.supabase.co», y si la plataforma no interpreta ese comodín, rechaza las fotos con 400. Se arregla dejando la variable disponible para todos los entornos y volviendo a desplegar.",
  });

  const obras = await listarObrasAdmin();
  const supabase = obras.length > 0 ? await clienteConSesion() : null;
  const rutas = supabase ? await rutasEnStorage(supabase) : null;

  /**
   * Las fotos cuya fila apunta a un archivo que no está en el bucket.
   *
   * Es el caso que costó encontrar: la fila se escribió y la subida no llegó,
   * así que el sitio pide una URL que Storage responde con un 400 en JSON. El
   * navegador no tiene imagen que pintar y muestra el texto alternativo. No se
   * arregla solo —no hay archivo que mostrar—: hay que borrar la foto y
   * subirla de nuevo.
   */
  // Solo se juzga lo que se listó: una ruta fuera de la carpeta de obras no
  // está ausente, está sin comprobar.
  const comprobables = obras.filter((obra) =>
    obra.imagen_path.startsWith(`${CARPETA_OBRAS}/`),
  );
  const sinArchivo = rutas
    ? comprobables.filter((obra) => !rutas.has(obra.imagen_path))
    : [];
  const sanas = rutas
    ? comprobables.filter((obra) => rutas.has(obra.imagen_path))
    : obras;

  if (obras.length > 0) {
    pruebas.push({
      nombre: "Cada foto tiene su archivo en Storage",
      ok: rutas ? sinArchivo.length === 0 : null,
      detalle: !rutas
        ? "no se pudo listar el bucket, así que esta prueba no concluye"
        : sinArchivo.length === 0
          ? `las ${comprobables.length} fotos tienen su archivo`
          : `${sinArchivo.length} de ${comprobables.length} apuntan a un archivo que no está. Hay que borrarlas y subirlas de nuevo: ${sinArchivo
              .map((obra) => `${obra.titulo} (${obra.exposicion?.titulo ?? "sin grupo"})`)
              .join(" · ")}`,
    });
  }

  const muestra = sanas[0];

  if (muestra) {
    pruebas.push({
      nombre: "La foto se puede leer sin sesión (bucket público)",
      ok: null,
      detalle: `${muestra.titulo} → ${await estadoDe(muestra.imagenUrl)}`,
    });

    const origen = await origenActual();
    if (origen) {
      const optimizada = `${origen}/_next/image?url=${encodeURIComponent(muestra.imagenUrl)}&w=640&q=75`;
      pruebas.push({
        nombre: "El optimizador de imágenes acepta la foto",
        ok: null,
        detalle: `${muestra.titulo} → ${await estadoDe(
          optimizada,
        )} — se prueba con una foto que sí tiene archivo, así que acá un 400 sí apunta a images.remotePatterns del despliegue. Un 200 significa que se puede volver a optimizar.`,
      });
    }
  }

  return (
    <>
      <EncabezadoPanel
        titulo="Diagnóstico"
        detalle="Por qué una foto no se ve. Ninguna prueba muestra claves."
      />

      {obras.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay ninguna foto que revisar"
          detalle="Las pruebas de Storage y del optimizador necesitan al menos una obra cargada."
        />
      ) : null}

      <ul className="flex flex-col border-t border-line">
        {pruebas.map(({ nombre, ok, detalle }) => (
          <li key={nombre} className="flex flex-col gap-1 border-b border-line py-4">
            <span className="flex items-baseline gap-2 text-[0.9375rem] text-ink">
              <span aria-hidden className={ok === false ? "text-danger" : "text-muted"}>
                {ok === true ? "●" : ok === false ? "✕" : "·"}
              </span>
              {nombre}
            </span>
            <span className="caption break-all text-muted">{detalle}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
