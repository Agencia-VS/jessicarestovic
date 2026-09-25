import { FichaDatos } from "./ficha-datos";

interface CartelaProps {
  titulo: string;
  /** Los datos del grupo; los que vienen vacíos no se dibujan. */
  datos?: { clave: string; valor: string | null }[];
  descripcion?: string | null;
  /** `h1` para el grupo de la página; `h2` para un conjunto dentro de él. */
  como?: "h1" | "h2";
}

/**
 * El rótulo de un grupo, como la cartela que va junto a un cuadro: el nombre,
 * sus datos y, si hay, un texto breve.
 *
 * Cambia de forma con la pantalla, y a pedido:
 *
 *  - En escritorio va bajo la foto principal, con la ficha completa —«Lugar»,
 *    «Año»— y el texto de la muestra en letra chica.
 *  - En el teléfono va sobre la foto y se reduce a lo mínimo: el nombre y una
 *    sola línea con los valores, sin etiquetas ni texto. Ahí la foto ocupa la
 *    pantalla entera, y todo lo que va antes empuja la obra hacia abajo.
 *
 * Dónde se ubica lo decide la galería; esto solo decide qué se lee.
 *
 * No cuenta obras ni fotos a propósito: Jessica pidió que el sitio no
 * enumere. El nombre de cada pieza aparece al abrirla en el visor.
 */
export function Cartela({ titulo, datos = [], descripcion, como: Titulo = "h1" }: CartelaProps) {
  const presentes = datos.filter((dato): dato is { clave: string; valor: string } =>
    Boolean(dato.valor),
  );

  return (
    <div className="flex flex-col">
      <Titulo className="font-display text-[1.375rem] leading-tight font-light -tracking-[0.01em] lg:text-[1.75rem]">
        {titulo}
      </Titulo>

      {presentes.length > 0 && (
        <>
          <p className="pie mt-1.5 text-faint lg:hidden">
            {presentes.map(({ valor }) => valor).join(" · ")}
          </p>
          <FichaDatos lineas={presentes} className="mt-3.5 hidden lg:flex" />
        </>
      )}

      {descripcion && (
        <p className="mt-3.5 hidden max-w-[52ch] text-sm leading-relaxed font-light text-pretty text-body lg:block">
          {descripcion}
        </p>
      )}
    </div>
  );
}
