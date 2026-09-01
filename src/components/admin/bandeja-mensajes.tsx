"use client";

import { useTransition } from "react";
import { eliminarMensaje, marcarLeido } from "@/lib/acciones/mensajes-admin";
import { whatsappUrl } from "@/lib/site-config";
import { Confirmar } from "./confirmar";
import type { MensajeRow } from "@/lib/data/tipos";

const ORIGEN: Record<MensajeRow["origen"], string> = {
  contacto: "Contacto",
  clases: "Clases",
};

const FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Bandeja con los envíos de Contacto y Clases, marcados leído / no leído, con
 * el correo de quien escribió a un clic de distancia (§07).
 */
export function BandejaMensajes({ mensajes }: { mensajes: MensajeRow[] }) {
  const [, iniciar] = useTransition();

  return (
    <ul className="border-t border-line">
      {mensajes.map((mensaje) => {
        const { id, nombre, email, telefono, leido, origen, creado_en } = mensaje;

        return (
          <li
            key={id}
            className={`border-b border-line py-5 ${leido ? "" : "border-l-2 border-l-ink pl-4"}`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className={`text-[1.0625rem] leading-snug ${leido ? "text-body" : "text-ink"}`}>
                  {nombre}
                </span>
                <span className="caption bg-line-soft px-2 py-0.5 text-muted">
                  {ORIGEN[origen]}
                </span>
                <span className="caption text-faint">{FECHA.format(new Date(creado_en))}</span>
              </div>

              <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed whitespace-pre-line text-body">
                {mensaje.mensaje}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent("Re: tu mensaje desde el sitio")}`}
                  className="caption text-ink underline underline-offset-4 transition-colors hover:text-muted"
                >
                  Responder a {email}
                </a>

                {telefono && (
                  <a
                    href={whatsappUrl(`Hola ${nombre}, recibí tu mensaje desde mi sitio.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="caption text-muted underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    {telefono}
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => iniciar(() => marcarLeido(id, !leido))}
                  className="caption text-muted transition-colors hover:text-ink"
                >
                  {leido ? "Marcar como no leído" : "Marcar como leído"}
                </button>

                <Confirmar
                  nombre={`el mensaje de ${nombre}`}
                  accion={() => iniciar(() => eliminarMensaje(id))}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
