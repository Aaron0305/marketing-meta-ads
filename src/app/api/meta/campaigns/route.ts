import { NextResponse } from "next/server";
import * as MetaActions from "@/actions/meta";

/**
 * GET /api/meta/campaigns — Lista campañas desde Meta
 */
export async function GET() {
  try {
    const campaigns = await MetaActions.getCampaigns();
    return NextResponse.json({ data: campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/meta/campaigns — Crea una nueva campaña
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await MetaActions.createCampaign(body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
