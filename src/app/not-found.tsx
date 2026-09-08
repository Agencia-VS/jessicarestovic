import { Pagina, Titulo } from "@/components/site/pagina";
import { EnlaceSuave } from "@/components/site/enlace-suave";

export default function NoEncontrada() {
  return (
    <Pagina>
      <div className="marco flex flex-1 flex-col items-start justify-center gap-6 gutter py-24">
        <Titulo>Esta página no existe</Titulo>
        <p className="max-w-[48ch] font-display text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed font-light text-body text-pretty">
          Puede que el enlace haya cambiado. La obra está en las exposiciones.
        </p>
        <EnlaceSuave href="/exposiciones">Ver exposiciones</EnlaceSuave>
      </div>
    </Pagina>
  );
}
