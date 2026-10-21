import { GaleriaObras } from "./galeria-obras";
import type { ExposicionDetalle } from "@/lib/data/tipos";

/** Las piezas de la muestra, separadas de las fotos que documentan la sala. */
export function ObrasDeExposicion({ exposicion }: { exposicion: ExposicionDetalle }) {
  if (exposicion.grupos.length === 0) return null;

  return (
    <section
      aria-labelledby="obras-de-la-exposicion"
      className="mt-[clamp(3rem,7vw,6.5rem)] flex flex-col gap-[clamp(2rem,4vw,3.5rem)] border-t border-line pt-[clamp(2rem,4vw,3.5rem)]"
    >
      <h2
        id="obras-de-la-exposicion"
        className="font-display text-[clamp(1.25rem,2vw,1.5rem)] leading-tight font-light"
      >
        Obras de esta exposición
      </h2>
      {exposicion.grupos.map((grupo, indice) => (
        <div key={grupo.nombre ?? `sin-conjunto-${indice}`} className="flex flex-col gap-4">
          {grupo.nombre && <h3 className="pie text-faint">{grupo.nombre}</h3>}
          <GaleriaObras obras={grupo.obras} contexto={grupo.nombre ?? exposicion.titulo} />
        </div>
      ))}
    </section>
  );
}
