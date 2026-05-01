import { NextResponse } from "next/server";
import * as MetaActions from "@/actions/meta";
import type { DateRange } from "@/types/meta";

/**
 * GET /api/meta/insights — Obtiene métricas con caché
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const dateRange = (searchParams.get("date_range") || "7d") as DateRange;

    const insights = campaignId
      ? await MetaActions.getCampaignInsights(campaignId, dateRange)
      : await MetaActions.getAccountInsights(dateRange);

    return NextResponse.json({ data: insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
