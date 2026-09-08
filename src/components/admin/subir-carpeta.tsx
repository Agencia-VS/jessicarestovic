"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { borrarSubidaPendiente, prepararSubidaImagen } from "@/lib/acciones/subida-directa";
import { crearObrasEnLote } from "@/lib/acciones/obras";
import { advertirDimensiones, ayudaImagen, validarArchivo } from "@/lib/images";
import { slugify } from "@/lib/validacion";
import { subirArchivoPorUrl } from "@/lib/subida-directa";
import type { Exposicion, ObraEnLoteEntrada } from "@/lib/data/tipos";
import { Boton, BotonEnlace } from "@/components/ui/boton";

interface Grupo {
  id: string;
  exposicionId: string;
  conjunto: string;
  anio: string;
  tecnica: string;
}

interface Fila {
  id: string;
  archivo: File;
  rutaRelativa: string;
  grupoId: string;
  previa: string;
  titulo: string;
  problema: string | null;
  advertencia: string | null;
  medidas: { ancho: number; alto: number } | null;
  ruta: string | null;
  progreso: number;
  subiendo: boolean;
}

interface SubirCarpetaProps {
  exposiciones: Exposicion[];
  conjuntos: string[];
  exposicionInicial?: string;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const IGNORAR = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
const ROMANOS: Array<[string, string]> = [
  ["VIII", "8"],
  ["VII", "7"],
  ["VI", "6"],
  ["IV", "4"],
  ["IX", "9"],
  ["V", "5"],
  ["III", "3"],
  ["II", "2"],
  ["I", "1"],
];

function rutaRelativa(archivo: File): string {
  return (archivo as File & { webkitRelativePath?: string }).webkitRelativePath || archivo.name;
}

function partesDe(ruta: string): string[] {
  return ruta.split(/[\\/]/).filter(Boolean);
}

function exposicionPorNombre(nombre: string, exposiciones: Exposicion[]): Exposicion | undefined {
  const slug = slugify(nombre);
  return exposiciones.find((exposicion) => exposicion.slug === slug || slugify(exposicion.titulo) === slug);
}

function tituloDesdeNombre(nombre: string): { titulo: string; problema: string | null } {
  let base = nombre.replace(/\.[^.]+$/, "").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();

  for (const [romano, numero] of ROMANOS) {
    const patron = new RegExp(`^${romano}(?=[\\s-])`, "i");
    if (patron.test(base)) {
      base = base.replace(patron, `${numero} `).trim();
      break;
    }
  }
  base = base.replace(/^\s*\d{1,3}\s*[-–—:]\s*/, "");
  base = base.replace(/\s*\((?:copia|copy|\d+)\)\s*$/i, "").trim();

  const pareceNombreDeCamara = /^(?:img|dsc|pxl|mvimg|screenshot|whatsapp image|image\d*|dcim)\b/i.test(base);
  if (pareceNombreDeCamara || base.length < 2) {
    return { titulo: "", problema: "Pon un título: el nombre parece de cámara." };
  }
  return { titulo: base, problema: null };
}

function grupoDesdeRuta(
  ruta: string,
  exposiciones: Exposicion[],
  exposicionInicial?: string,
): { exposicionId: string; conjunto: string } {
  const partes = partesDe(ruta);
  const carpetas = partes.slice(0, -1);
  let encontrada: { exposicion: Exposicion; indice: number } | undefined;

  // Busca desde el final para admitir tanto «raíz/exposición/conjunto» como
  // «exposición/conjunto» en carpetas elegidas desde el explorador.
  for (let indice = carpetas.length - 1; indice >= 0; indice -= 1) {
    const exposicion = exposicionPorNombre(carpetas[indice]!, exposiciones);
    if (exposicion) {
      encontrada = { exposicion, indice };
      break;
    }
  }

  if (encontrada) {
    return {
      exposicionId: encontrada.exposicion.id,
      conjunto: carpetas.slice(encontrada.indice + 1).join(" / "),
    };
  }

  return {
    exposicionId: exposicionInicial ?? "",
    conjunto: carpetas.length > 1 ? carpetas.slice(1).join(" / ") : "",
  };
}

function idDeGrupo(exposicionId: string, conjunto: string, ruta: string): string {
  return `${exposicionId || "sin-exposicion"}:${slugify(conjunto) || slugify(ruta) || "sin-conjunto"}`;
}

function nombreAlt(fila: Fila, grupo: Grupo | undefined): string {
  return [fila.titulo, grupo?.conjunto].filter(Boolean).join(" · ");
}

export function SubirCarpeta({
  exposiciones,
  conjuntos,
  exposicionInicial,
}: SubirCarpetaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const filasActuales = useRef<Fila[]>([]);
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    filasActuales.current = filas;
  }, [filas]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.setAttribute("webkitdirectory", "");
    inputRef.current.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    const haySubida = guardando || filas.some((fila) => fila.subiendo);
    if (!haySubida) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [filas, guardando]);

  useEffect(
    () => () => {
      for (const fila of filasActuales.current) {
        URL.revokeObjectURL(fila.previa);
        if (fila.ruta) void borrarSubidaPendiente(fila.ruta, "obra");
      }
    },
    [],
  );

  const actualizarFila = (id: string, cambio: Partial<Fila>) => {
    setFilas((previas) => previas.map((fila) => (fila.id === id ? { ...fila, ...cambio } : fila)));
  };

  const preparar = (archivos: FileList | File[]) => {
    const id = ++version.current;
    for (const fila of filasActuales.current) {
      URL.revokeObjectURL(fila.previa);
      if (fila.ruta) void borrarSubidaPendiente(fila.ruta, "obra");
    }
    setMensaje(null);

    const elegibles = Array.from(archivos)
      .filter((archivo) => archivo.size > 0 && !IGNORAR.has(archivo.name.toLowerCase()))
      .sort((a, b) => collator.compare(rutaRelativa(a), rutaRelativa(b)));

    const gruposNuevos = new Map<string, Grupo>();
    const filasNuevas: Fila[] = [];
    for (const [indice, archivo] of elegibles.entries()) {
      const ruta = rutaRelativa(archivo);
      const contexto = grupoDesdeRuta(ruta, exposiciones, exposicionInicial);
      const grupoId = idDeGrupo(contexto.exposicionId, contexto.conjunto, ruta);
      if (!gruposNuevos.has(grupoId)) {
        gruposNuevos.set(grupoId, {
          id: grupoId,
          exposicionId: contexto.exposicionId,
          conjunto: contexto.conjunto,
          anio: "",
          tecnica: "",
        });
      }

      const titulo = tituloDesdeNombre(archivo.name);
      const problemaArchivo = validarArchivo(archivo, "obra");
      filasNuevas.push({
        id: `${id}-${indice}`,
        archivo,
        rutaRelativa: ruta,
        grupoId,
        previa: URL.createObjectURL(archivo),
        titulo: titulo.titulo,
        problema: problemaArchivo ?? titulo.problema,
        advertencia: null,
        medidas: null,
        ruta: null,
        progreso: 0,
        subiendo: false,
      });
    }

    // Cuando una carpeta contiene copias, el sufijo evita dos fichas con el
    // mismo título sin inventar nombres para fotos de cámara.
    const totales = new Map<string, number>();
    for (const fila of filasNuevas) {
      if (fila.titulo) totales.set(fila.titulo, (totales.get(fila.titulo) ?? 0) + 1);
    }
    const vistos = new Map<string, number>();
    for (const fila of filasNuevas) {
      if (!fila.titulo || (totales.get(fila.titulo) ?? 0) < 2) continue;
      const numero = (vistos.get(fila.titulo) ?? 0) + 1;
      vistos.set(fila.titulo, numero);
      fila.titulo = `${fila.titulo} (${numero})`;
    }

    setGrupos([...gruposNuevos.values()]);
    setFilas(filasNuevas);

    for (const fila of filasNuevas) {
      if (fila.problema) continue;
      const imagen = new Image();
      imagen.onload = () => {
        if (id !== version.current) return;
        const medidas = { ancho: imagen.naturalWidth, alto: imagen.naturalHeight };
        actualizarFila(fila.id, {
          medidas,
          advertencia: advertirDimensiones(medidas.ancho, medidas.alto, "obra"),
        });
      };
      imagen.onerror = () => {
        if (id === version.current) {
          actualizarFila(fila.id, { problema: "No pudimos leer esa foto." });
        }
      };
      imagen.src = fila.previa;
    }
  };

  const cambiarGrupo = (grupoId: string, cambio: Partial<Grupo>) => {
    setGrupos((previos) => previos.map((grupo) => (grupo.id === grupoId ? { ...grupo, ...cambio } : grupo)));
  };

  const subirFila = async (fila: Fila): Promise<string | null> => {
    if (fila.ruta) return fila.ruta;
    actualizarFila(fila.id, { subiendo: true, progreso: 0 });
    let rutaFirmada: string | null = null;
    try {
      const firma = await prepararSubidaImagen("obra", fila.archivo.type, fila.archivo.size);
      if ("error" in firma) {
        actualizarFila(fila.id, { problema: firma.error, subiendo: false });
        return null;
      }

      rutaFirmada = firma.path;
      await subirArchivoPorUrl(firma.url, fila.archivo, (progreso) => {
        if (version.current > 0) actualizarFila(fila.id, { progreso });
      });
      actualizarFila(fila.id, { ruta: firma.path, progreso: 100, subiendo: false });
      return firma.path;
    } catch (error) {
      if (rutaFirmada) await borrarSubidaPendiente(rutaFirmada, "obra");
      actualizarFila(fila.id, {
        problema:
          error instanceof Error
            ? error.message
            : "No pudimos subir esta foto. Revisa tu conexión y vuelve a intentar.",
        subiendo: false,
      });
      return null;
    }
  };

  const confirmar = async () => {
    setMensaje(null);
    if (filas.length === 0) {
      setMensaje("Elige una carpeta con fotos JPG, PNG, WebP o AVIF.");
      return;
    }
    if (filas.some((fila) => fila.problema || !fila.titulo.trim() || !fila.medidas)) {
      setMensaje("Revisa los avisos de las fotos antes de continuar.");
      return;
    }

    setGuardando(true);
    const rutas = new Map<string, string>();
    filas.filter((fila) => fila.ruta).forEach((fila) => rutas.set(fila.id, fila.ruta!));
    let siguiente = 0;
    const subirTrabajador = async () => {
      while (siguiente < filas.length) {
        const fila = filas[siguiente++]!;
        const ruta = await subirFila(fila);
        if (ruta) rutas.set(fila.id, ruta);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(2, filas.length) }, () => subirTrabajador()),
    );

    if (rutas.size !== filas.length) {
      setGuardando(false);
      setMensaje("No se pudieron subir todas las fotos. Corrige el aviso y vuelve a intentar.");
      return;
    }

    const gruposMapa = new Map(grupos.map((grupo) => [grupo.id, grupo]));
    const entradas: ObraEnLoteEntrada[] = filas.map((fila) => {
      const grupo = gruposMapa.get(fila.grupoId);
      const anio = grupo?.anio.trim() ? Number.parseInt(grupo.anio, 10) : null;
      return {
        titulo: fila.titulo.trim(),
        exposicion_id: grupo?.exposicionId || null,
        conjunto: grupo?.conjunto.trim() || null,
        anio: Number.isInteger(anio) ? anio : null,
        tecnica: grupo?.tecnica.trim() || null,
        dimensiones: null,
        imagen_alt: nombreAlt(fila, grupo),
        imagen_path: rutas.get(fila.id)!,
        imagen_ancho: fila.medidas?.ancho ?? null,
        imagen_alto: fila.medidas?.alto ?? null,
        destacada: false,
        publicada: true,
      };
    });

    const resultado = await crearObrasEnLote(entradas);
    if ("error" in resultado) {
      setGuardando(false);
      setMensaje(resultado.error);
      return;
    }
    router.push(`/admin/trabajos-recientes?aviso=obras-creadas&cantidad=${resultado.cantidad}`);
  };

  const porGrupo = useMemo(
    () => new Map(grupos.map((grupo) => [grupo.id, filas.filter((fila) => fila.grupoId === grupo.id)])),
    [filas, grupos],
  );
  const exposicionInicialValida = exposicionInicial ?? "";

  return (
    <div className="flex flex-col gap-8">
      <label
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setArrastrando(false);
          preparar(evento.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center ${
          arrastrando ? "border-ink bg-line-soft" : "border-line hover:border-faint"
        }`}
      >
        <span className="text-sm text-ink">Arrastra aquí una carpeta de fotos</span>
        <span className="caption text-muted">También puedes tocar para elegirla desde el celular o computador.</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(evento) => preparar(evento.target.files ?? [])}
          className="sr-only"
        />
        <span className="caption text-ink underline underline-offset-4">Elegir carpeta</span>
      </label>

      <p className="caption text-faint">{ayudaImagen("obra")} Los archivos HEIC deben convertirse a JPG.</p>

      {grupos.map((grupo) => {
        const grupoFilas = porGrupo.get(grupo.id) ?? [];
        return (
          <section key={grupo.id} className="flex flex-col gap-4 border-t border-line pt-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-light">{grupo.conjunto || "Sin conjunto"}</h2>
                <span className="caption text-muted">{grupoFilas.length} fotos</span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow text-muted">Exposición</span>
                  <select
                    value={grupo.exposicionId}
                    onChange={(evento) => cambiarGrupo(grupo.id, { exposicionId: evento.target.value })}
                    className="w-full border-b border-line bg-transparent py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">Sin exposición</option>
                    {exposiciones.map((exposicion) => (
                      <option key={exposicion.id} value={exposicion.id}>
                        {exposicion.titulo}{!exposicion.publicada ? " (oculta)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow text-muted">Conjunto</span>
                  <input
                    value={grupo.conjunto}
                    onChange={(evento) => cambiarGrupo(grupo.id, { conjunto: evento.target.value })}
                    list="conjuntos-carpeta"
                    className="w-full border-b border-line bg-transparent py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow text-muted">Año</span>
                  <input
                    value={grupo.anio}
                    onChange={(evento) => cambiarGrupo(grupo.id, { anio: evento.target.value })}
                    inputMode="numeric"
                    placeholder="Opcional"
                    className="w-full border-b border-line bg-transparent py-2.5 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex max-w-xl flex-col gap-1.5">
                <span className="eyebrow text-muted">Técnica</span>
                <input
                  value={grupo.tecnica}
                  onChange={(evento) => cambiarGrupo(grupo.id, { tecnica: evento.target.value })}
                  placeholder="Opcional para todo el grupo"
                  className="w-full border-b border-line bg-transparent py-2.5 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none"
                />
              </label>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {grupoFilas.map((fila) => (
                <li key={fila.id} className="flex gap-3 border border-line p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fila.previa} alt="" className="h-24 w-28 shrink-0 object-contain bg-line-soft" />
                  <div className="min-w-0 flex-1">
                    <p className="caption truncate text-muted" title={fila.rutaRelativa}>{fila.rutaRelativa}</p>
                    <label className="mt-1 flex flex-col gap-1">
                      <span className="sr-only">Título de {fila.rutaRelativa}</span>
                      <input
                        value={fila.titulo}
                        placeholder="Título pendiente"
                        onChange={(evento) => {
                          const titulo = evento.target.value;
                          const problema = fila.problema?.toLowerCase().includes("título")
                            ? titulo.trim()
                              ? null
                              : fila.problema
                            : fila.problema;
                          actualizarFila(fila.id, { titulo, problema });
                        }}
                        className="w-full border-b border-line bg-transparent py-1 text-sm text-ink placeholder:text-danger focus:border-ink focus:outline-none"
                      />
                    </label>
                    <p className="caption mt-1 text-faint">Alt: {nombreAlt(fila, grupo) || "pendiente"}</p>
                    {fila.medidas && <p className="caption text-faint">{fila.medidas.ancho} × {fila.medidas.alto} px</p>}
                    {fila.subiendo && <p className="caption text-muted">Subiendo… {fila.progreso}%</p>}
                    {fila.problema && <p className="caption mt-1 text-danger">{fila.problema}</p>}
                    {fila.advertencia && <p className="caption mt-1 text-muted">{fila.advertencia}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <datalist id="conjuntos-carpeta">
        {conjuntos.map((conjunto) => <option key={conjunto} value={conjunto} />)}
      </datalist>

      {mensaje && <p role="alert" className="caption text-danger">{mensaje}</p>}

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Boton type="button" onClick={confirmar} cargando={guardando} disabled={filas.length === 0}>
          Confirmar y guardar obras
        </Boton>
        <BotonEnlace href="/admin/trabajos-recientes">Cancelar</BotonEnlace>
      </div>

      <p className="caption text-faint">Las fotos se suben directamente y las obras se guardan juntas al confirmar.</p>
      <p className="sr-only">Exposición inicial: {exposicionInicialValida}</p>
    </div>
  );
}
