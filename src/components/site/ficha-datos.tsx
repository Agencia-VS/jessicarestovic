interface Linea {
  clave: string;
  valor: string;
}

/**
 * La ficha de un grupo: clave en versalitas tenues, valor debajo, y los datos
 * uno al lado del otro.
 *
 * Va en fila y no en columna porque vive en la cartela, bajo la foto
 * principal: ahí tiene el ancho de un tercio de página y dos o tres datos
 * caben en una línea. En columna, al costado del título, era lo que la
 * cartela reemplazó.
 */
export function FichaDatos({ lineas, className = "" }: { lineas: Linea[]; className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-x-8 gap-y-2.5 ${className}`}>
      {lineas.map(({ clave, valor }) => (
        <div key={clave} className="flex flex-col gap-[3px]">
          <dt className="etiqueta text-label">{clave}</dt>
          <dd className="text-[0.8125rem] leading-normal font-light text-body">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
