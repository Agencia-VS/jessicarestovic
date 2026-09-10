import { headers } from "next/headers";
import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasAdmin } from "@/lib/data/consultas";
import { clienteConSesion } from "@/lib/acciones/comun";
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
 * Esta página hace las tres preguntas de una vez, sobre una foto real y desde
 * el propio despliegue, y dice cuál falla. Vive dentro del panel, así que pide
 * sesión; no muestra ninguna clave.
 */

interface Prueba {
  nombre: string;
  ok: boolean | null;
  detalle: string;
}

const TIEMPO_MAXIMO = 12_000;

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

  const [obra] = await listarObrasAdmin();

  if (obra) {
    const supabase = await clienteConSesion();
    const info = supabase
      ? await supabase.storage.from(BUCKET_IMAGENES).info(obra.imagen_path)
      : null;

    pruebas.push({
      nombre: "El archivo de la primera foto está en Storage",
      ok: info ? Boolean(info.data) && !info.error : null,
      detalle: info?.data
        ? `${obra.imagen_path} · ${info.data.contentType ?? "sin tipo"} · ${Math.round((info.data.size ?? 0) / 1024)} kB`
        : `${obra.imagen_path} · ${info?.error?.message ?? "no se pudo consultar"}`,
    });

    pruebas.push({
      nombre: "La foto se puede leer sin sesión (bucket público)",
      ok: null,
      detalle: `${obra.imagenUrl} → ${await estadoDe(obra.imagenUrl)}`,
    });

    const origen = await origenActual();
    if (origen) {
      const optimizada = `${origen}/_next/image?url=${encodeURIComponent(obra.imagenUrl)}&w=640&q=75`;
      pruebas.push({
        nombre: "El optimizador de imágenes acepta la foto",
        ok: null,
        detalle: `${await estadoDe(optimizada)} — un 400 significa que la URL no calza con images.remotePatterns del despliegue`,
      });
    }
  }

  return (
    <>
      <EncabezadoPanel
        titulo="Diagnóstico"
        detalle="Por qué una foto no se ve. Ninguna prueba muestra claves."
      />

      {obra ? null : (
        <EstadoVacio
          titulo="Todavía no hay ninguna foto que revisar"
          detalle="Las pruebas de Storage y del optimizador necesitan al menos una obra cargada."
        />
      )}

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
