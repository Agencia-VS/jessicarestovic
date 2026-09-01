import { Aviso } from "./aviso";

const AVISOS: Record<string, string> = {
  "obra-creada": "Obra publicada.",
  "exposicion-creada": "Exposición publicada.",
};

/** Muestra el aviso que quedó en la URL tras un redirect. */
export function AvisoQuery({ clave }: { clave?: string }) {
  const aviso = clave ? AVISOS[clave] : undefined;
  if (!aviso) return null;

  return <Aviso resultado={{ estado: "ok", aviso }} />;
}
