import type { Resultado } from "@/lib/acciones/resultado";

/**
 * Mensaje de resultado de una acción. Los éxitos se dicen con palabras
 * («Obra publicada»), no con un check silencioso (§07).
 */
export function Aviso({ resultado }: { resultado: Resultado }) {
  if (!resultado.aviso) return null;

  const error = resultado.estado === "error";

  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-6 border-l-2 px-5 py-4 text-sm text-ink ${
        error ? "border-danger bg-danger-soft" : "border-success bg-success-soft"
      }`}
    >
      {resultado.aviso}
    </p>
  );
}
