import Link from "next/link";
import { Pagina } from "@/components/site/pagina";
import { InicioDestacadas } from "@/components/site/inicio-destacadas";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { listarObrasDestacadas, obtenerConfiguracion } from "@/lib/data/consultas";

// El contenido lo administra Jessica: revalidamos cada 5 minutos para que una
// obra nueva aparezca sola, sin volver a desplegar.
export const revalidate = 300;

export default async function InicioPage() {
  const [destacadas, config] = await Promise.all([
    listarObrasDestacadas(),
    obtenerConfiguracion(),
  ]);

  return (
    <Pagina comoTitulo>
      {destacadas.length > 0 ? (
        <InicioDestacadas obras={destacadas} cita={config.cita} />
      ) : (
        <div className="gutter flex flex-1 flex-col justify-center py-20">
          <EstadoVacio
            titulo="La obra destacada aparece acá"
            detalle={`Marca una obra como destacada en el panel y se mostrará en esta portada. Mientras tanto, la galería completa está en «Obra».`}
          >
            <Link href="/obra" className="eyebrow mt-2 text-ink underline underline-offset-4">
              Ver la obra
            </Link>
          </EstadoVacio>
          <p className="mt-10 max-w-[52ch] text-[0.9375rem] leading-relaxed text-body text-pretty">
            «{config.cita}»
          </p>
        </div>
      )}
    </Pagina>
  );
}
