"use server";

/**
 * Meta Ads Actions — Campañas, Ad Sets, Ads y Métricas (Next.js Server Actions)
 * @see Fase 2-3 del plan maestro
 */

import { metaFetch, getAdAccountId } from "@/lib/meta";
import { createServerClient } from "@/lib/supabase";
import type {
  MetaCampaign, MetaInsight, MetaApiResponse,
  CreateCampaignInput, CreateAdSetInput, CreateAdInput, DateRange,
} from "@/types/meta";

// ─── Campaigns ───────────────────────────────────────────────────────

export async function getCampaigns(): Promise<MetaCampaign[]> {
  const accountId = getAdAccountId();
  const response = await metaFetch<MetaApiResponse<MetaCampaign>>(
    `/${accountId}/campaigns`,
    { params: { fields: "id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time", limit: "100" } }
  );
  return response.data;
}

export async function createCampaign(input: CreateCampaignInput): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  return metaFetch<{ id: string }>(`/${accountId}/campaigns`, {
    method: "POST",
    body: JSON.stringify({ name: input.name, objective: input.objective, status: input.status, daily_budget: input.daily_budget, special_ad_categories: input.special_ad_categories, start_time: input.start_time, stop_time: input.stop_time }),
  });
}

export async function updateCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED") {
  await metaFetch(`/${campaignId}`, { method: "POST", body: JSON.stringify({ status }) });
  return { success: true };
}

// ─── Ad Sets ─────────────────────────────────────────────────────────

export async function createAdSet(input: CreateAdSetInput): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  return metaFetch<{ id: string }>(`/${accountId}/adsets`, { method: "POST", body: JSON.stringify(input) });
}

// ─── Ads ─────────────────────────────────────────────────────────────

export async function createAd(input: CreateAdInput): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  return metaFetch<{ id: string }>(`/${accountId}/ads`, { method: "POST", body: JSON.stringify(input) });
}

// ─── Insights ────────────────────────────────────────────────────────

const INSIGHT_FIELDS = "spend,impressions,reach,clicks,ctr,cpm,actions,cost_per_action_type,date_start,date_stop";

function getDateRangeParams(range: DateRange): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().split("T")[0];
  const daysMap: Record<string, number> = { today: 0, "7d": 7, "14d": 14, "30d": 30 };
  const days = daysMap[range] ?? 7;
  const since = new Date(now.getTime() - days * 86400000).toISOString().split("T")[0];
  return { since, until };
}

export async function getAccountInsights(dateRange: DateRange = "7d"): Promise<MetaInsight[]> {
  const accountId = getAdAccountId();
  const { since, until } = getDateRangeParams(dateRange);
  const response = await metaFetch<MetaApiResponse<MetaInsight>>(`/${accountId}/insights`, {
    params: { fields: INSIGHT_FIELDS, time_range: JSON.stringify({ since, until }), time_increment: "1", level: "account" },
  });
  return response.data;
}

export async function getCampaignInsights(campaignId: string, dateRange: DateRange = "7d"): Promise<MetaInsight[]> {
  const { since, until } = getDateRangeParams(dateRange);
  const response = await metaFetch<MetaApiResponse<MetaInsight>>(`/${campaignId}/insights`, {
    params: { fields: INSIGHT_FIELDS, time_range: JSON.stringify({ since, until }), time_increment: "1" },
  });
  return response.data;
}

// ─── Cache ───────────────────────────────────────────────────────────

export async function getCachedInsights(campaignId: string, since: string, until: string): Promise<MetaInsight[] | null> {
  const supabase = createServerClient();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("metrics_cache").select("*")
    .eq("campaign_id", campaignId).gte("date", since).lte("date", until)
    .gte("fetched_at", thirtyMinAgo).order("date", { ascending: true });
  if (error || !data?.length) return null;
  return data.map((row) => ({ campaign_id: row.campaign_id, date_start: row.date, date_stop: row.date, spend: String(row.spend), impressions: String(row.impressions), reach: String(row.reach), clicks: String(row.clicks), ctr: String(row.ctr), cpm: String(row.cpm) }));
}

export async function cacheInsights(campaignId: string, insights: MetaInsight[]) {
  const supabase = createServerClient();
  const rows = insights.map((i) => ({ campaign_id: campaignId, date: i.date_start, spend: parseFloat(i.spend), impressions: parseInt(i.impressions), reach: parseInt(i.reach), clicks: parseInt(i.clicks), cpm: parseFloat(i.cpm), ctr: parseFloat(i.ctr), fetched_at: new Date().toISOString() }));
  const { error } = await supabase.from("metrics_cache").upsert(rows, { onConflict: "campaign_id,date" });
  if (error) console.error("[Meta] Error caching:", error.message);
}
