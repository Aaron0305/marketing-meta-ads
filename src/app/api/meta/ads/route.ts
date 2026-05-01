import { NextResponse } from "next/server";
import * as MetaActions from "@/actions/meta";

/**
 * POST /api/meta/ads — Crea un anuncio con creativo
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await MetaActions.createAd(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
