import Link from "next/link";
import { Pagina, Seccion } from "./pagina";
import { GaleriaObras } from "./galeria-obras";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { SECCIONES_TRABAJO } from "@/lib/site-config";
import type { Exposicion, Obra } from "@/lib/data/tipos";
import type { SeccionTrabajo } from "@/types/database";

interface ListadoDeTrabajosProps {
  seccion: SeccionTrabajo;
  conjuntos: (Exposicion & { obras: Obra[] })[];
}

export function ListadoDeTrabajos({ seccion, conjuntos }: ListadoDeTrabajosProps) {
  return (
    <Pagina>
      <Seccion titulo={SECCIONES_TRABAJO[seccion].label}>
        {conjuntos.length > 0 ? (
          <div className="flex flex-col gap-[clamp(3rem,7vw,6.5rem)]">
            {conjuntos.map((conjunto, indice) => {
              const { id, slug, titulo, obras } = conjunto;
              const encabezado = (
                <h2 className="mb-4 font-display text-[1.375rem] leading-tight font-light lg:text-[1.75rem]">
                  <Link href={`/trabajos/${slug}`} className="hover:underline underline-offset-4">
                    {titulo}
                  </Link>
                </h2>
              );

              return (
                <section key={id}>
                  {obras.length > 0 ? (
                    <GaleriaObras
                      obras={obras}
                      contexto={titulo}
                      cartela={encabezado}
                      prioridad={indice === 0}
                      encuadrePortada={{
                        x: conjunto.portada_foco_x ?? 50,
                        y: conjunto.portada_foco_y ?? 50,
                      }}
                    />
                  ) : (
                    <>
                      {encabezado}
                      <EstadoVacio titulo="Este conjunto todavía no tiene obras publicadas" />
                    </>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <EstadoVacio titulo="Todavía no hay conjuntos publicados en esta sección" />
        )}
      </Seccion>
    </Pagina>
  );
}
