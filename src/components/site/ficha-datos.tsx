interface Linea {
  clave: string;
  valor: string;
}

/**
 * La columna de datos que acompaña a un texto: clave en versalitas tenues,
 * valor debajo. La usan la página de serie y la de exposición.
 */
export function FichaDatos({ lineas }: { lineas: Linea[] }) {
  return (
    <div className="flex flex-col gap-[clamp(0.75rem,1.6vw,1.125rem)]">
      {lineas.map(({ clave, valor }) => (
        <div key={clave} className="flex flex-col gap-[3px]">
          <span className="etiqueta text-label">{clave}</span>
          <span className="text-[0.8125rem] leading-normal font-light text-body">{valor}</span>
        </div>
      ))}
    </div>
  );
}
