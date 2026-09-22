/**
 * La flecha de «anterior» y «siguiente»: tipografía del sitio, no un icono.
 *
 * La usan el visor y la tira de miniaturas de la galería. Vive en su propio
 * archivo porque son dos consumidores y el estilo tiene que ser el mismo: dos
 * copias del mismo botón se separan a la primera corrección.
 */
export function Paso({
  direccion,
  onClick,
  desactivado = false,
  rotulo = "Foto",
}: {
  direccion: "anterior" | "siguiente";
  onClick: () => void;
  /** En la tira, los extremos no giran: la flecha se apaga. */
  desactivado?: boolean;
  /** Qué avanza: una foto en el visor, un grupo de miniaturas en la tira. */
  rotulo?: string;
}) {
  const esAnterior = direccion === "anterior";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivado}
      aria-label={`${rotulo} ${esAnterior ? "anterior" : "siguiente"}`}
      className="shrink-0 font-display text-[clamp(1.5rem,2.6vw,2.125rem)] leading-none font-extralight text-label transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
    >
      {esAnterior ? "‹" : "›"}
    </button>
  );
}
