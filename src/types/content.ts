/**
 * Content & Creative Types
 *
 * Tipado para el sistema de generación de contenido con IA
 * y la biblioteca de creativos.
 *
 * @see Fase 4-5 del plan maestro
 */

// ─── Creative Assets ─────────────────────────────────────────────────

export type CreativeType = "copy" | "image" | "both";
export type Platform = "facebook" | "instagram" | "both";

export interface CreativeAsset {
  id: string;
  user_id: string;
  type: CreativeType;
  prompt: string;
  copy_text: string | null;
  image_url: string | null;
  image_path: string | null;
  platform: Platform;
  used_in_ad: boolean;
  meta_ad_id: string | null;
  created_at: string;
}

// ─── Copy Generation ─────────────────────────────────────────────────

export interface CopyVariant {
  headline: string;
  body: string;
  cta: string;
}

export interface GenerateCopyInput {
  objective: string;
  platform: Platform;
  referenceImage?: { base64: string; mimeType: string };
}

export interface GenerateCopyOutput {
  copies: CopyVariant[];
}

// ─── Image Generation ────────────────────────────────────────────────

export interface GenerateImageInput {
  prompt: string;
  platform: Platform;
  referenceImage?: { base64: string; mimeType: string };
}

export interface GenerateImageOutput {
  imageUrl: string;
  imagePath: string;
}

// ─── Library Filters ─────────────────────────────────────────────────

export interface LibraryFilters {
  type?: CreativeType;
  platform?: Platform;
  usedInAd?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ─── Metrics Cache ───────────────────────────────────────────────────

export interface MetricsCacheEntry {
  id: string;
  campaign_id: string;
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  cpm: number;
  ctr: number;
  fetched_at: string;
}

// ─── System Config ───────────────────────────────────────────────────

export interface SystemConfig {
  key: string;
  value: string;
  updated_at: string;
}

// ─── User ────────────────────────────────────────────────────────────

export type UserRole = "admin" | "academy";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
