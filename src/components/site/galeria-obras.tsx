import type { Obra } from "@/lib/data/tipos";
import { Galeria } from "./galeria";
import { piezasDeObras } from "./piezas";

interface GaleriaObrasProps {
  obras: Obra[];
  /** El nombre del conjunto o del grupo, para los rótulos accesibles. */
  contexto: string;
  /** El rótulo que va con la foto principal. */
  cartela?: React.ReactNode;
}

/**
 * Las obras de un conjunto, con la misma estructura que las vistas de sala:
 * portada grande, su cartela y miniaturas cuadradas.
 *
 * El nombre de cada obra no se escribe en la página: aparece al abrirla, en el
 * visor, junto a su año, técnica y medidas.
 */
export function GaleriaObras({ obras, contexto, cartela }: GaleriaObrasProps) {
  return <Galeria piezas={piezasDeObras(obras)} cartela={cartela} contexto={contexto} />;
}
