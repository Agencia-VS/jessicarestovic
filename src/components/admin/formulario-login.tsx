"use client";

import { useActionState, useState } from "react";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { iniciarSesion, recuperarContrasena } from "@/lib/acciones/sesion";
import { INICIAL } from "@/lib/acciones/resultado";

interface FormularioLoginProps {
  /** Ruta del panel a la que volver después de entrar. */
  volver?: string;
}

export function FormularioLogin({ volver = "" }: FormularioLoginProps) {
  const [modo, setModo] = useState<"entrar" | "recuperar">("entrar");
  const [entrada, accionEntrar, entrando] = useActionState(iniciarSesion, INICIAL);
  const [recuperacion, accionRecuperar, recuperando] = useActionState(
    recuperarContrasena,
    INICIAL,
  );

  const resultado = modo === "entrar" ? entrada : recuperacion;

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      {resultado.aviso && (
        <p
          role={resultado.estado === "error" ? "alert" : "status"}
          className={`border-l-2 px-5 py-4 text-sm text-ink ${
            resultado.estado === "error"
              ? "border-danger bg-danger-soft"
              : "border-success bg-success-soft"
          }`}
        >
          {resultado.aviso}
        </p>
      )}

      {modo === "entrar" ? (
        <form action={accionEntrar} className="flex flex-col gap-7">
          <input type="hidden" name="volver" value={volver} />
          <Campo
            etiqueta="Correo"
            nombre="email"
            type="email"
            requerido
            autoComplete="username"
            autoFocus
          />
          <Campo
            etiqueta="Contraseña"
            nombre="password"
            type="password"
            requerido
            autoComplete="current-password"
          />
          <Boton type="submit" cargando={entrando}>
            {entrando ? "Entrando…" : "Entrar"}
          </Boton>
        </form>
      ) : (
        <form action={accionRecuperar} className="flex flex-col gap-7">
          <Campo
            etiqueta="Correo"
            nombre="email"
            type="email"
            requerido
            autoComplete="username"
            autoFocus
            ayuda="Te enviamos un enlace para crear una contraseña nueva."
          />
          <Boton type="submit" cargando={recuperando}>
            {recuperando ? "Enviando…" : "Enviar enlace"}
          </Boton>
        </form>
      )}

      <button
        type="button"
        onClick={() => setModo(modo === "entrar" ? "recuperar" : "entrar")}
        className="caption self-start text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        {modo === "entrar" ? "Olvidé mi contraseña" : "Volver a entrar con mi contraseña"}
      </button>
    </div>
  );
}
