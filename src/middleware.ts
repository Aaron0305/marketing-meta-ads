import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — Auth Guard
 *
 * Protege las rutas del dashboard y redirige a /login
 * si no hay sesión activa.
 *
 * @see Fase 1 del plan maestro
 */

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Permitir archivos estáticos y API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Verificar si existe la cookie temporal 'wtii_session'
  // (Esto permite al usuario explorar el dashboard)
  if (request.cookies.has("wtii_session")) {
    return NextResponse.next();
  }

  // Si no hay sesión, redirigir al login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
