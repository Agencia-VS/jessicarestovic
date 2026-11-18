import { Pagina, Seccion } from "./pagina";
import { TarjetasDeGrupos } from "./tarjetas-de-grupos";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { SECCIONES_TRABAJO } from "@/lib/site-config";
import type { Exposicion } from "@/lib/data/tipos";
import type { SeccionTrabajo } from "@/types/database";

interface ListadoDeTrabajosProps {
  seccion: SeccionTrabajo;
  conjuntos: Exposicion[];
}

export function ListadoDeTrabajos({ seccion, conjuntos }: ListadoDeTrabajosProps) {
  return (
    <Pagina>
      <Seccion titulo={SECCIONES_TRABAJO[seccion].label}>
        {conjuntos.length > 0 ? (
          <TarjetasDeGrupos
            grupos={conjuntos}
            hrefDe={({ slug }) => `/trabajos/${slug}`}
            conLugar={false}
            portadaCompleta
          />
        ) : (
          <EstadoVacio titulo="Todavía no hay conjuntos publicados en esta sección" />
        )}
      </Seccion>
    </Pagina>
  );
}
