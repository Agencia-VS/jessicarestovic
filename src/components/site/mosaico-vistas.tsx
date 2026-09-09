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
                  src={portada.imagenUrl}
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
