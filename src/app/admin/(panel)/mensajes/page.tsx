import { EncabezadoPanel } from "@/components/admin/encabezado-panel";
import { BandejaMensajes } from "@/components/admin/bandeja-mensajes";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarMensajes } from "@/lib/data/consultas";

export const metadata = { title: "Mensajes" };

export default async function MensajesAdminPage() {
  const mensajes = await listarMensajes();
  const sinLeer = mensajes.filter((mensaje) => !mensaje.leido).length;

  return (
    <>
      <EncabezadoPanel
        titulo="Mensajes"
        detalle={
          mensajes.length > 0
            ? `${mensajes.length} en total, ${sinLeer} sin leer. Los de Contacto y los de Clases llegan a la misma bandeja, etiquetados.`
            : undefined
        }
      />

      {mensajes.length > 0 ? (
        <BandejaMensajes mensajes={mensajes} />
      ) : (
        <EstadoVacio
          titulo="No hay mensajes todavía"
          detalle="Acá llegan los envíos de los formularios de Contacto y de Clases."
        />
      )}
    </>
  );
}
