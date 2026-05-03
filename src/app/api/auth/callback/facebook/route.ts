import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=facebook_auth_failed", request.url));
  }

  if (code) {
    // Aquí en el futuro se puede intercambiar el código por el Access Token
    // Por ahora, solo redirigimos a la página principal con éxito
    return NextResponse.redirect(new URL("/?success=facebook_auth_completed", request.url));
  }

  return NextResponse.json({ status: "ok", message: "Facebook OAuth Callback Ready" });
}
