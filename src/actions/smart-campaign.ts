"use server";

/**
 * Smart Campaign Actions — IA + Meta Ads Integration
 * 
 * Flujo: Usuario describe → Gemini genera estrategia → Se publica en Meta
 * @see Fase 7 del plan maestro
 */

import { generateWithRetry } from "@/lib/gemini";
import { metaFetch, getAdAccountId } from "@/lib/meta";
import { CAMPAIGN_STRATEGY_PROMPT } from "@/constants/prompts";

// ─── Tipos ───────────────────────────────────────────────────────────

export interface CampaignStrategy {
  campaignName: string;
  objective: string;
  reasonObjective: string;
  dailyBudget: number;
  duration: number;
  reasonBudget: string;
  targeting: {
    ageMin: number;
    ageMax: number;
    genders: number[];
    interests: { id: string; name: string }[];
    reasonTargeting: string;
  };
  copies: {
    headline: string;
    body: string;
    cta: string;
    linkDescription: string;
  }[];
  platform: "facebook" | "instagram" | "both";
  tips: string[];
}

export interface PublishResult {
  campaignId: string;
  adSetId: string;
  adId: string;
  status: string;
}

// ─── Coordenadas de Ixtlahuaca ──────────────────────────────────────

const IXTLAHUACA_GEO = {
  latitude: 19.5686,
  longitude: -99.7682,
  radius: 15, // km
  distance_unit: "kilometer" as const,
};

// ─── Paso 1: Gemini genera la estrategia ─────────────────────────────

export async function generateCampaignStrategy(objective: string): Promise<CampaignStrategy> {
  const prompt = CAMPAIGN_STRATEGY_PROMPT.replace("{OBJETIVO}", objective);
  const responseText = await generateWithRetry(prompt);

  // Extraer JSON de la respuesta
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini no devolvió un JSON válido para la estrategia");
  }

  const strategy = JSON.parse(jsonMatch[0]) as CampaignStrategy;

  // Validaciones básicas
  if (!strategy.campaignName || !strategy.objective || !strategy.copies?.length) {
    throw new Error("La estrategia generada está incompleta");
  }

  // Asegurar mínimos de presupuesto
  if (strategy.dailyBudget < 5000) {
    strategy.dailyBudget = 5000; // Mínimo $50 MXN
  }

  return strategy;
}

// ─── Paso 2: Publicar en Meta (Campaign → AdSet → Ad) ───────────────

export async function publishCampaign(
  strategy: CampaignStrategy,
  selectedCopyIndex: number = 0,
  link?: string
): Promise<PublishResult> {
  const accountId = getAdAccountId();
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) throw new Error("META_ACCESS_TOKEN no está configurado");

  const copy = strategy.copies[selectedCopyIndex] || strategy.copies[0];
  const META_BASE = "https://graph.facebook.com/v25.0";

  // Helper para hacer POST a Meta con form-urlencoded
  async function metaPost<T>(path: string, data: Record<string, string>): Promise<T> {
    const body = new URLSearchParams({ ...data, access_token: accessToken! });
    const response = await fetch(`${META_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const json = await response.json();
    if (!response.ok || json.error) {
      const msg = json?.error?.message || `HTTP ${response.status}`;
      console.error("[Meta POST]", path, JSON.stringify(json.error));
      throw new Error(`Meta API: ${msg}`);
    }
    return json as T;
  }

  // ── 1. Crear la Campaña ──
  console.log("[Smart Campaign] Creando campaña:", strategy.campaignName);
  const campaignResult = await metaPost<{ id: string }>(
    `/${accountId}/campaigns`,
    {
      name: strategy.campaignName,
      objective: strategy.objective,
      status: "PAUSED",
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false",
    }
  );
  console.log("[Smart Campaign] Campaña creada:", campaignResult.id);

  // ── 2. Crear el Ad Set (audiencia + presupuesto) ──
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + strategy.duration);

  const targeting: any = {
    age_min: strategy.targeting.ageMin,
    age_max: strategy.targeting.ageMax,
    genders: strategy.targeting.genders,
    geo_locations: {
      custom_locations: [
        {
          latitude: IXTLAHUACA_GEO.latitude,
          longitude: IXTLAHUACA_GEO.longitude,
          radius: IXTLAHUACA_GEO.radius,
          distance_unit: IXTLAHUACA_GEO.distance_unit,
        },
      ],
    },
  };
  // Nota: No incluimos interests/flexible_spec porque Gemini genera IDs inventados.
  // La segmentación por ubicación (15km Ixtlahuaca) + edad es más efectiva para negocios locales.

  console.log("[Smart Campaign] Creando Ad Set con targeting:", JSON.stringify(targeting));
  const adSetResult = await metaPost<{ id: string }>(
    `/${accountId}/adsets`,
    {
      name: `${strategy.campaignName} - AdSet`,
      campaign_id: campaignResult.id,
      daily_budget: String(strategy.dailyBudget),
      billing_event: "IMPRESSIONS",
      optimization_goal: strategy.objective === "OUTCOME_REACH" ? "REACH" : "LINK_CLICKS",
      targeting: JSON.stringify(targeting),
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: "PAUSED",
    }
  );
  console.log("[Smart Campaign] Ad Set creado:", adSetResult.id);

  // ── 3. Crear el Ad Creative ──
  // Nota: Necesitamos un page_id para el creative. Si no se tiene, usamos un post simple.
  const pageId = process.env.META_PAGE_ID;

  let adCreativeResult: { id: string };

  if (pageId) {
    // Con Page ID: creative completo con link_data
    const objectStorySpec = {
      page_id: pageId,
      link_data: {
        message: copy.body,
        link: link || "https://www.facebook.com",
        name: copy.headline,
        description: copy.linkDescription || "",
        call_to_action: { type: copy.cta || "LEARN_MORE" },
      },
    };

    adCreativeResult = await metaPost<{ id: string }>(
      `/${accountId}/adcreatives`,
      {
        name: `${strategy.campaignName} - Creative`,
        object_story_spec: JSON.stringify(objectStorySpec),
      }
    );
  } else {
    // Sin Page ID: creative simple con título y cuerpo
    adCreativeResult = await metaPost<{ id: string }>(
      `/${accountId}/adcreatives`,
      {
        name: `${strategy.campaignName} - Creative`,
        title: copy.headline,
        body: copy.body,
        link_url: link || "https://www.facebook.com",
        call_to_action_type: copy.cta || "LEARN_MORE",
      }
    );
  }
  console.log("[Smart Campaign] Creative creado:", adCreativeResult.id);

  // ── 4. Crear el Ad ──
  const adResult = await metaPost<{ id: string }>(
    `/${accountId}/ads`,
    {
      name: `${strategy.campaignName} - Ad`,
      adset_id: adSetResult.id,
      creative: JSON.stringify({ creative_id: adCreativeResult.id }),
      status: "PAUSED",
    }
  );
  console.log("[Smart Campaign] Ad creado:", adResult.id);

  return {
    campaignId: campaignResult.id,
    adSetId: adSetResult.id,
    adId: adResult.id,
    status: "PAUSED",
  };
}
