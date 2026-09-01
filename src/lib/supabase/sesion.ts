import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseConfigurado, supabaseEnv } from "./env";

/** Prefijo del panel y ruta de acceso. */
const ADMIN = "/admin";
const LOGIN = "/admin/login";

/**
 * Refresca la sesión en cada request y protege el panel: sin sesión, todo
 * `/admin/*` redirige al login; con sesión, el login redirige al panel.
 */
export async function actualizarSesion(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Sin configurar todavía: dejamos pasar para que el sitio muestre su estado
  // vacío en vez de fallar con un error de entorno.
  if (!supabaseConfigurado()) return response;

  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // `getUser()` revalida el token contra Supabase. No usar `getSession()` acá:
  // lee la cookie sin verificarla.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esAdmin = pathname === ADMIN || pathname.startsWith(`${ADMIN}/`);
  const esLogin = pathname === LOGIN;

  if (esAdmin && !esLogin && !user) {
    const destino = request.nextUrl.clone();
    destino.pathname = LOGIN;
    destino.search = pathname === ADMIN ? "" : `?volver=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(destino);
  }

  if (esLogin && user) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/admin/obras";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}
