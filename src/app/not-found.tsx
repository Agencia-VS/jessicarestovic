import { Pagina } from "@/components/site/pagina";
import { BotonEnlace } from "@/components/ui/boton";

export default function NoEncontrada() {
  return (
    <Pagina>
      <div className="gutter flex flex-1 flex-col items-start justify-center gap-6 py-24">
        <h1 className="font-display text-4xl md:text-5xl">Esta página no existe</h1>
        <p className="max-w-[48ch] text-[0.9375rem] leading-relaxed text-body">
          Puede que el enlace haya cambiado. La obra completa está en la galería.
        </p>
        <BotonEnlace href="/obra">Ver la obra</BotonEnlace>
      </div>
    </Pagina>
  );
}
