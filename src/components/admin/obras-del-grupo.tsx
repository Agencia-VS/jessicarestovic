import { GrillaObras } from "./grilla-obras";
import { AvisoQuery } from "./aviso-query";
import { BotonEnlace } from "@/components/ui/boton";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import type { Exposicion, Obra } from "@/lib/data/tipos";

interface ObrasDelGrupoProps {
  grupo: Exposicion;
  obras: Obra[];
  /** El aviso que quedó en la URL tras subir. */
  aviso?: string;
}

/**
 * Las obras de un grupo, dentro de su propia página.
 *
 * Es el mismo gesto que las vistas de sala: se entra al grupo y las obras se
 * suben ahí, sin pasar por una sección aparte ni elegir el grupo en un
 * desplegable. El arrastre ordena la retícula que se ve en el sitio.
 */
export function ObrasDelGrupo({ grupo, obras, aviso }: ObrasDelGrupoProps) {
  const esTrabajo = grupo.tipo === "trabajo";
  const total = obras.length;

  return (
    <section className="mt-14 flex flex-col gap-5 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-[clamp(1.375rem,2.4vw,2rem)] leading-tight font-light">
            Obras {esTrabajo ? "de este conjunto" : "de esta exposición"}
          </h2>
          <p className="caption text-muted">
            {total > 0
              ? `${total} ${total === 1 ? "obra" : "obras"}. Arrastra para cambiar el orden en que se ven en el sitio.`
              : "Sube varias de una vez. Cada obra necesita un título, que puedes revisar antes de guardar."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <BotonEnlace href={`/admin/obras/carpeta?exposicion=${grupo.id}`} variante="primario">
            Subir obras
          </BotonEnlace>
          <BotonEnlace href={`/admin/obras/nueva?exposicion=${grupo.id}`} variante="secundario">
            Subir una obra
          </BotonEnlace>
        </div>
      </div>

      <AvisoQuery clave={aviso} />

      {total > 0 ? (
        <GrillaObras obras={obras} conEncabezado={false} />
      ) : (
        <EstadoVacio
          titulo={
            esTrabajo
              ? "Este conjunto todavía no tiene obras"
              : "Esta muestra todavía no tiene obras"
          }
          detalle="Con «Subir obras» puedes elegir varias o una carpeta completa y escribir el título de cada obra antes de guardarlas."
        />
      )}
    </section>
  );
}
