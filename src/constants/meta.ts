/**
 * Meta API Constants
 */

export const META_API_VERSION = "v21.0";
export const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const INSIGHT_FIELDS = [
  "spend", "impressions", "reach", "clicks",
  "ctr", "cpm", "actions", "cost_per_action_type",
  "date_start", "date_stop",
] as const;

export const CAMPAIGN_FIELDS = [
  "id", "name", "objective", "status",
  "daily_budget", "lifetime_budget",
  "start_time", "stop_time",
  "created_time", "updated_time",
] as const;

export const CACHE_TTL_MINUTES = 30;
