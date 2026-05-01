import { NextResponse } from "next/server";
import * as MetaActions from "@/actions/meta";

/**
 * POST /api/meta/adsets — Crea un Ad Set con audiencia
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await MetaActions.createAdSet(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
