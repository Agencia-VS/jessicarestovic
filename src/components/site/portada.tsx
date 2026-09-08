import { Foto, Hueco } from "./foto";
import { EnlaceSuave } from "./enlace-suave";

interface PortadaProps {
  imagen: {
    src: string;
    alt: string;
    ancho: number | null;
    alto: number | null;
  } | null;
  /** La frase de portada, editable desde el panel. */
  cita: string;
}

/**
 * El Inicio: una imagen que ocupa casi toda la pantalla y una sola línea de
 * texto. Nada más.
 *
 * Es el único lugar del sitio donde Jessica habla en su nombre desde el primer
 * segundo, así que la frase es contenido, no decoración — se edita en
 * «Configuración» del panel.
 */
export function Portada({ imagen, cita }: PortadaProps) {
  return (
    <section className="marco gutter flex flex-col gap-[clamp(1.125rem,2.4vw,2rem)] pt-[clamp(1.25rem,3vw,2.75rem)] pb-[clamp(1.75rem,4vw,3.5rem)]">
      <div className="w-full">
        {imagen ? (
          <Foto
            src={imagen.src}
            alt={imagen.alt}
            ancho={imagen.ancho}
            alto={imagen.alto}
            variante="exacta"
            sizes="(max-width: 90rem) 100vw, 1440px"
            prioridad
            className="w-full max-h-[calc(100dvh-14.375rem)] min-h-80"
          />
        ) : (
          <Hueco
            proporcion={3 / 2}
            etiqueta="Todavía no hay una imagen de portada"
            className="max-h-[calc(100dvh-14.375rem)] min-h-80"
          />
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-[clamp(1rem,3vw,3rem)] gap-y-4">
        <p className="max-w-[34ch] font-display text-[clamp(1.1875rem,2vw,1.6875rem)] leading-[1.45] font-light -tracking-[0.01em] text-pretty">
          {cita}
        </p>
        <EnlaceSuave href="/exposiciones">Ver exposiciones</EnlaceSuave>
      </div>
    </section>
  );
}
