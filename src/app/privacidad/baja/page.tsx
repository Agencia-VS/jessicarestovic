import Link from "next/link";
import { Pagina, Titulo } from "@/components/site/pagina";
import { BajaNovedades } from "@/components/site/baja-novedades";
export const metadata = { title:"Baja de novedades", robots:{index:false,follow:false}, referrer:"no-referrer" as const };
export default function BajaPage() {
  return <Pagina><div className="mx-auto flex w-full max-w-[65rem] flex-col gap-6 gutter py-12"><Titulo>Baja de novedades</Titulo><p>Confirma que quieres retirar tu autorización para recibir novedades por correo. Esto no impide que respondamos tus consultas.</p><BajaNovedades /><Link href="/privacidad" className="underline">Ver privacidad y otras formas de contacto</Link></div></Pagina>;
}
