import { Aviso } from "./aviso";

const AVISOS: Record<string, string> = {
  "obra-creada": "Obra publicada.",
  "obras-creadas": "Obras guardadas.",
  "exposicion-creada": "Exposición publicada.",
  "trabajo-creado": "Conjunto de trabajo creado.",
};

/** Muestra el aviso que quedó en la URL tras un redirect. */
export function AvisoQuery({ clave }: { clave?: string }) {
  const aviso = clave ? AVISOS[clave] : undefined;
  if (!aviso) return null;

  return <Aviso resultado={{ estado: "ok", aviso }} />;
}
