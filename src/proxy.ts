import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/sesion";

/**
 * En Next.js 16 la convención `middleware` pasó a llamarse `proxy`.
 * Corre antes de cada render: refresca la sesión de Supabase y protege
 * `/admin/*`.
 */
export default async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
