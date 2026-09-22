import type { Obra } from "@/lib/data/tipos";
import { Galeria } from "./galeria";
import { piezasDeObras } from "./piezas";

interface GaleriaObrasProps {
  obras: Obra[];
  /** El nombre del conjunto o de la muestra, para los rótulos accesibles. */
  contexto: string;
}

/**
 * Las obras de un conjunto, con la misma estructura que las vistas de sala:
 * portada grande y miniaturas cuadradas.
 *
 * Antes eran filas justificadas, donde la proporción de cada foto decidía su
 * ancho. Jessica pidió la retícula pareja; lo que se pierde —ver cada obra en
 * su forma real desde la retícula— se recupera al hacer clic, y a cambio la
 * página se recorre de un vistazo.
 */
export function GaleriaObras({ obras, contexto }: GaleriaObrasProps) {
  return <Galeria piezas={piezasDeObras(obras)} conTitulos contexto={contexto} />;
}
