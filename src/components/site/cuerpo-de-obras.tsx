import Link from "next/link";
import { Seccion } from "./pagina";
import { GaleriaObras } from "./galeria-obras";
import { Cartela } from "./cartela";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import type { GrupoDeObras } from "@/lib/data/tipos";

interface CuerpoDeObrasProps {
  titulo: string;
  descripcion: string | null;
  /** Las obras agrupadas por conjunto; el bloque sin conjunto va primero. */
  grupos: GrupoDeObras[];
  /** Los datos de la cartela, en el orden en que se leen. */
  datos: { clave: string; valor: string | null }[];
  /**
   * El enlace de vuelta al índice. Solo en escritorio: en el teléfono la
   * cabecera ya lleva el desplegable de la sección, que también vuelve.
   */
  volver: { href: string; titulo: string };
  vacio: { titulo: string; detalle: string };
}

/**
 * El cuerpo de obra de un conjunto de trabajo: su cartela y sus obras.
 *
 * Tiene la forma de la página de una exposición —la foto principal con la
 * cartela, y las miniaturas— y el mismo marco, así que al pasar de una sección
 * a otra el título cae en el mismo lugar. No cuenta piezas ni ofrece saltar al
 * conjunto siguiente: para eso están el índice y el desplegable del teléfono.
 *
 * La cartela del conjunto va con su primera galería. Cada conjunto con nombre
 * es su propia `GaleriaObras`, rotulada con ese nombre, así que las flechas de
 * la vista ampliada recorren solo el conjunto con el que se abrió.
 */
export function CuerpoDeObras({
  titulo,
  descripcion,
  grupos,
  datos,
  volver,
  vacio,
}: CuerpoDeObrasProps) {
  const cartela = <Cartela titulo={titulo} datos={datos} descripcion={descripcion} />;

  return (
    <Seccion titulo={titulo} tituloComo="p">
      <Link
        href={volver.href}
        className="eyebrow mb-[clamp(1.875rem,4vw,3.5rem)] hidden text-faint transition-colors hover:text-ink lg:inline-block"
      >
        ← {volver.titulo}
      </Link>

      {grupos.length > 0 ? (
        <div className="flex flex-col gap-[clamp(3rem,7vw,6.5rem)]">
          {grupos.map((grupo, indice) => (
            <section key={grupo.nombre ?? `sin-conjunto-${indice}`}>
              <GaleriaObras
                obras={grupo.obras}
                contexto={grupo.nombre ?? titulo}
                cartela={
                  indice === 0 ? (
                    <>
                      {cartela}
                      {grupo.nombre && <h2 className="pie mt-4 text-faint">{grupo.nombre}</h2>}
                    </>
                  ) : (
                    grupo.nombre && <Cartela titulo={grupo.nombre} como="h2" />
                  )
                }
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {cartela}
          <EstadoVacio titulo={vacio.titulo} detalle={vacio.detalle} />
        </div>
      )}
    </Seccion>
  );
}
