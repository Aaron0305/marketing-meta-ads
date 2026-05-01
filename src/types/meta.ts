/**
 * Meta Graph API Types
 *
 * Tipado para las respuestas y peticiones de la Meta Graph API v21.0.
 * Cubre campañas, ad sets, ads e insights.
 *
 * @see https://developers.facebook.com/docs/marketing-api/reference
 */

// ─── Campaign ────────────────────────────────────────────────────────

export type CampaignObjective = "OUTCOME_ENGAGEMENT" | "OUTCOME_TRAFFIC" | "OUTCOME_AWARENESS" | "OUTCOME_LEADS" | "OUTCOME_SALES";

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface MetaCampaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
}

export interface CreateCampaignInput {
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget?: number; // In cents
  start_time?: string;
  stop_time?: string;
  special_ad_categories: string[];
}

// ─── Ad Set ──────────────────────────────────────────────────────────

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: CampaignStatus;
  daily_budget?: string;
  targeting: MetaTargeting;
  start_time?: string;
  end_time?: string;
}

export interface MetaTargeting {
  age_min: number;
  age_max: number;
  genders: number[]; // 1 = male, 2 = female
  geo_locations: {
    cities?: Array<{ key: string; radius: number; distance_unit: string }>;
    countries?: string[];
  };
  interests?: Array<{ id: string; name: string }>;
}

export interface CreateAdSetInput {
  name: string;
  campaign_id: string;
  daily_budget: number;
  targeting: MetaTargeting;
  start_time?: string;
  end_time?: string;
  billing_event: "IMPRESSIONS" | "LINK_CLICKS";
  optimization_goal: string;
}

// ─── Ad ──────────────────────────────────────────────────────────────

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: CampaignStatus;
  creative: {
    id: string;
  };
}

export interface CreateAdInput {
  name: string;
  adset_id: string;
  creative: {
    title: string;
    body: string;
    image_url: string;
    link_url: string;
    call_to_action_type: string;
  };
}

// ─── Insights ────────────────────────────────────────────────────────

export interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpm: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
}

export type DateRange = "today" | "7d" | "14d" | "30d" | "custom";

// ─── API Response ────────────────────────────────────────────────────

export interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
    previous?: string;
  };
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}
