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
 * Las fotos de un grupo, dentro de su propia página.
 *
 * Es el mismo gesto que las vistas de sala: se entra al grupo y las fotos se
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
            Fotos de {esTrabajo ? "este conjunto" : "esta muestra"}
          </h2>
          <p className="caption text-muted">
            {total > 0
              ? `${total} ${total === 1 ? "foto" : "fotos"}. Arrastra para cambiar el orden en que se ven en el sitio.`
              : "Sube varias de una vez: los títulos salen del nombre de cada archivo y se pueden corregir antes de guardar."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <BotonEnlace href={`/admin/obras/carpeta?exposicion=${grupo.id}`} variante="primario">
            Subir fotos
          </BotonEnlace>
          <BotonEnlace href={`/admin/obras/nueva?exposicion=${grupo.id}`} variante="secundario">
            Subir una sola
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
              ? "Este conjunto todavía no tiene fotos"
              : "Esta muestra todavía no tiene obras"
          }
          detalle="Con «Subir fotos» puedes elegir varias, o una carpeta completa, y revisarlas antes de guardar."
        />
      )}
    </section>
  );
}
