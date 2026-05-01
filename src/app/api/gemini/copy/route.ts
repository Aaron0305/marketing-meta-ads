import { NextResponse } from "next/server";
import * as GeminiActions from "@/actions/gemini";

/**
 * POST /api/gemini/copy — Genera 3 variantes de copy
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await GeminiActions.generateCopies(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
