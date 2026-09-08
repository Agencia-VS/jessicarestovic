import Link from "next/link";
import type { Exposicion } from "@/lib/data/tipos";
import { Foto, Hueco } from "./foto";
import { SIZES_MOSAICO } from "./figura-obra";

/**
 * Las portadas de «Todas»: una imagen por muestra, con su lugar, año y el
 * total de imágenes. Mostrar las 85 vistas de una vez habría sido ruido.
 */
export function PortadasExposiciones({ exposiciones }: { exposiciones: Exposicion[] }) {
  return (
    <div className="mosaico">
      {exposiciones.map((expo, indice) => {
        const portada = expo.fotos[0];
        const lugar = [expo.lugar, expo.anio].filter(Boolean).join(" · ");
        const total =
          expo.fotos.length > 0
            ? `${expo.fotos.length} ${expo.fotos.length === 1 ? "imagen" : "imágenes"}`
            : "Sin fotos todavía";

        return (
          <figure key={expo.id} className="mb-[clamp(1.875rem,3.8vw,3.875rem)] break-inside-avoid">
            <Link href={`/exposiciones/${expo.slug}`} className="group flex flex-col gap-3">
              {portada ? (
                <Foto
                  path={portada.imagen_path}
                  alt={portada.imagen_alt}
                  ancho={portada.imagen_ancho}
                  alto={portada.imagen_alto}
                  sizes={SIZES_MOSAICO}
                  prioridad={indice === 0}
                  className="w-full"
                />
              ) : (
                <Hueco proporcion={3 / 2} etiqueta={`Sin fotos de ${expo.titulo} todavía`} />
              )}

              <figcaption className="flex flex-col gap-1">
                <span className="self-start border-b border-transparent font-display text-[1.0625rem] leading-tight font-light transition-colors group-hover:border-accent">
                  {expo.titulo}
                </span>
                <span className="pie text-faint">
                  {[lugar, total].filter(Boolean).join(" · ")}
                </span>
              </figcaption>
            </Link>
          </figure>
        );
      })}
    </div>
  );
}

/**
 * Las vistas de montaje de una muestra, en foto completa. También acá se ven
 * enteras: una sala recortada pierde justamente lo que documenta.
 */
export function VistasDeSala({ exposicion }: { exposicion: Exposicion }) {
  const lugar = [exposicion.lugar, exposicion.anio].filter(Boolean).join(" · ");
  const total = exposicion.fotos.length;

  return (
    <div className="mosaico">
      {exposicion.fotos.map((foto, indice) => (
        <figure key={foto.id} className="mb-[clamp(1.875rem,3.8vw,3.875rem)] break-inside-avoid">
          <div className="flex flex-col gap-3">
            <Foto
              path={foto.imagen_path}
              alt={foto.imagen_alt}
              ancho={foto.imagen_ancho}
              alto={foto.imagen_alto}
              sizes={SIZES_MOSAICO}
              prioridad={indice === 0}
              className="w-full"
            />
            <figcaption className="pie text-faint">
              {[lugar, `Vista ${indice + 1} de ${total}`].filter(Boolean).join(" · ")}
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
