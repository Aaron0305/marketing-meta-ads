import { NextResponse } from "next/server";

/**
 * Auth API Routes
 *
 * Manejo de autenticación con Supabase Auth.
 * Callback para OAuth, verificación de email, etc.
 *
 * @see Fase 1 del plan maestro
 */

export async function GET(request: Request) {
  // TODO: Fase 1 — Auth callback handler (Supabase Auth)
  return NextResponse.json(
    { message: "Auth callback — pendiente de implementación" },
    { status: 501 }
  );
}
