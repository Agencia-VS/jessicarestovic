import type { Exposicion } from "@/lib/data/tipos";
import { Galeria } from "./galeria";
import { piezasDeVistas } from "./piezas";

/**
 * Las vistas de montaje de una muestra: una de portada y el resto en
 * miniaturas cuadradas.
 *
 * Los títulos no se dibujan bajo cada cuadrado porque acá son «Vista 3 de 7»,
 * que repetido no dice nada; el visor sí los muestra, junto al lugar y el año.
 *
 * Las flechas del visor recorren solo las vistas de esta muestra, que es lo
 * que se espera al haber entrado por ella.
 */
export function VistasDeSala({ exposicion }: { exposicion: Exposicion }) {
  return <Galeria piezas={piezasDeVistas(exposicion)} contexto={exposicion.titulo} />;
}
