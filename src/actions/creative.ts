"use server";

/**
 * Creative Assets Actions — CRUD de la biblioteca (Next.js Server Actions)
 * @see Fase 4-5 del plan maestro
 */

import { createServerClient } from "@/lib/supabase";
import { deleteCreativeImage } from "@/lib/storage";
import type { CreativeAsset, CreativeType, Platform, LibraryFilters } from "@/types/content";

interface SaveCreativeInput {
  userId: string;
  type: CreativeType;
  prompt: string;
  copyText: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  platform: Platform;
}

export async function saveCreativeAsset(input: SaveCreativeInput): Promise<CreativeAsset> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("creative_assets").insert({
    user_id: input.userId, type: input.type, prompt: input.prompt,
    copy_text: input.copyText, image_url: input.imageUrl,
    image_path: input.imagePath, platform: input.platform,
  }).select().single();
  if (error) throw new Error(`Error guardando creativo: ${error.message}`);
  return data as CreativeAsset;
}

export async function getCreativeAssets(filters: LibraryFilters): Promise<{ assets: CreativeAsset[]; total: number }> {
  const supabase = createServerClient();
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;

  let query = supabase.from("creative_assets").select("*", { count: "exact" });
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.platform) query = query.eq("platform", filters.platform);
  if (filters.usedInAd !== undefined) query = query.eq("used_in_ad", filters.usedInAd);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw new Error(`Error obteniendo creativos: ${error.message}`);
  return { assets: (data || []) as CreativeAsset[], total: count || 0 };
}

export async function markAsUsedInAd(assetId: string, metaAdId: string) {
  const supabase = createServerClient();
  const { error } = await supabase.from("creative_assets").update({ used_in_ad: true, meta_ad_id: metaAdId }).eq("id", assetId);
  if (error) throw new Error(`Error actualizando creativo: ${error.message}`);
}

export async function deleteCreativeAsset(assetId: string) {
  const supabase = createServerClient();
  const { data } = await supabase.from("creative_assets").select("image_path").eq("id", assetId).single();
  if (data?.image_path) await deleteCreativeImage(data.image_path);
  await supabase.from("creative_assets").delete().eq("id", assetId);
}
