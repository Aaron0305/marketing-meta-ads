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

export type PublishCampaignResponse =
  | { ok: true; data: PublishResult }
  | { ok: false; error: string };

class MetaApiError extends Error {
  code?: number;
  subcode?: number;
  userMessage?: string;

  constructor(message: string, opts?: { code?: number; subcode?: number; userMessage?: string }) {
    super(message);
    this.name = "MetaApiError";
    this.code = opts?.code;
    this.subcode = opts?.subcode;
    this.userMessage = opts?.userMessage;
  }
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
  // Cumplimiento de políticas de Meta para segmentación:
  // evitamos públicos menores de edad en campañas automatizadas.
  if (strategy.targeting.ageMin < 18) {
    strategy.targeting.ageMin = 18;
  }
  if (strategy.targeting.ageMax < strategy.targeting.ageMin) {
    strategy.targeting.ageMax = strategy.targeting.ageMin;
  }

  return strategy;
}

// ─── Paso 2: Publicar en Meta (Campaign → AdSet → Ad) ───────────────

export async function publishCampaign(
  strategy: CampaignStrategy,
  selectedCopyIndex: number = 0,
  link?: string
): Promise<PublishCampaignResponse> {
  const accountId = getAdAccountId();
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, error: "META_ACCESS_TOKEN no está configurado" };
  }

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
      const err = json?.error || {};
      const msg = err?.error_user_msg || err?.message || `HTTP ${response.status}`;
      console.error("[Meta POST]", path, JSON.stringify(json.error));
      throw new MetaApiError(`Meta API: ${msg}`, {
        code: err?.code,
        subcode: err?.error_subcode,
        userMessage: err?.error_user_msg,
      });
    }
    return json as T;
  }

  async function resolveValidPageId(): Promise<string | undefined> {
    const configuredPageId = process.env.META_PAGE_ID?.trim();
    const numericConfiguredPageId =
      configuredPageId && /^\d+$/.test(configuredPageId)
        ? configuredPageId
        : undefined;

    try {
      type PagesResponse = { data?: Array<{ id?: string; name?: string }> };
      const pages = await metaFetch<PagesResponse>("/me/accounts", {
        params: { limit: "25" },
      });
      const pageIds = new Set(
        (pages?.data || []).map((p) => p.id).filter((id): id is string => Boolean(id))
      );

      if (numericConfiguredPageId && pageIds.has(numericConfiguredPageId)) {
        return numericConfiguredPageId;
      }

      const candidate = pages?.data?.find((p) => p?.id && /^\d+$/.test(p.id));
      if (candidate?.id) {
        console.warn(
          "[Smart Campaign] META_PAGE_ID no coincide con páginas accesibles por el token. Usando:",
          candidate.id
        );
        return candidate.id;
      }
    } catch (error) {
      console.warn("[Smart Campaign] No se pudo resolver page_id desde /me/accounts", error);
    }

    if (numericConfiguredPageId) {
      return numericConfiguredPageId;
    }

    return undefined;
  }

  async function assertPageIdIsUsable(pageId: string): Promise<void> {
    try {
      type PageResponse = { id?: string; name?: string };
      const page = await metaFetch<PageResponse>(`/${pageId}`, {
        params: { fields: "id,name" },
      });
      if (!page?.id) {
        throw new Error("No page id in response");
      }
    } catch (error) {
      console.error("[Smart Campaign] Page validation failed for page_id:", pageId, error);
      throw new MetaApiError(
        `Meta API: El META_PAGE_ID (${pageId}) no es accesible con el token actual.`,
        {
          userMessage:
            "El META_PAGE_ID no es accesible con este token/app. Verifica que la página esté conectada al negocio y que el token tenga acceso real a esa página.",
        }
      );
    }
  }

  try {
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

    const safeAgeMin = Math.max(18, strategy.targeting.ageMin);
    const safeAgeMax = Math.max(safeAgeMin, strategy.targeting.ageMax);
    const targeting: any = {
      age_min: safeAgeMin,
      age_max: safeAgeMax,
      genders: strategy.targeting.genders,
      // Meta v25 exige declarar explícitamente Advantage Audience
      // en algunas cuentas al crear ad sets.
      targeting_automation: {
        advantage_audience: 0,
      },
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

    const optimizationGoal =
      strategy.objective === "OUTCOME_REACH" ? "REACH" : "LINK_CLICKS";
    // In Graph API v25 some accounts require explicit bid strategy,
    // even for lowest-cost ad sets.
    const bidStrategy = "LOWEST_COST_WITHOUT_CAP";

    console.log("[Smart Campaign] Creando Ad Set con targeting:", JSON.stringify(targeting));
    let adSetResult: { id: string };
    try {
      adSetResult = await metaPost<{ id: string }>(
        `/${accountId}/adsets`,
        {
          name: `${strategy.campaignName} - AdSet`,
          campaign_id: campaignResult.id,
          daily_budget: String(strategy.dailyBudget),
          billing_event: "IMPRESSIONS",
          optimization_goal: optimizationGoal,
          bid_strategy: bidStrategy,
          targeting: JSON.stringify(targeting),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: "PAUSED",
        }
      );
    } catch (error) {
      if (
        error instanceof MetaApiError &&
        error.code === 100 &&
        error.subcode === 1870227
      ) {
        const targetingWithAdvantage = {
          ...targeting,
          targeting_automation: {
            advantage_audience: 1,
          },
        };
        console.warn(
          "[Smart Campaign] Retry Ad Set with advantage_audience=1"
        );
        adSetResult = await metaPost<{ id: string }>(
          `/${accountId}/adsets`,
          {
            name: `${strategy.campaignName} - AdSet`,
            campaign_id: campaignResult.id,
            daily_budget: String(strategy.dailyBudget),
            billing_event: "IMPRESSIONS",
            optimization_goal: optimizationGoal,
            bid_strategy: bidStrategy,
            targeting: JSON.stringify(targetingWithAdvantage),
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: "PAUSED",
          }
        );
      } else
      // Fallback para cuentas que fuerzan límite de puja.
      if (
        error instanceof MetaApiError &&
        error.code === 100 &&
        error.subcode === 2490487
      ) {
        const fallbackBidAmount = String(Math.max(100, Math.floor(strategy.dailyBudget * 0.2)));
        console.warn(
          "[Smart Campaign] Retry Ad Set with BID_CAP. bid_amount:",
          fallbackBidAmount
        );
        adSetResult = await metaPost<{ id: string }>(
          `/${accountId}/adsets`,
          {
            name: `${strategy.campaignName} - AdSet`,
            campaign_id: campaignResult.id,
            daily_budget: String(strategy.dailyBudget),
            billing_event: "IMPRESSIONS",
            optimization_goal: optimizationGoal,
            bid_strategy: "LOWEST_COST_WITH_BID_CAP",
            bid_amount: fallbackBidAmount,
            targeting: JSON.stringify(targeting),
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: "PAUSED",
          }
        );
      } else {
        throw error;
      }
    }
    console.log("[Smart Campaign] Ad Set creado:", adSetResult.id);

    // ── 3. Crear el Ad Creative ──
    const normalizedPageId = await resolveValidPageId();
    const defaultLink = link || "https://www.facebook.com";

    let adCreativeResult: { id: string };

    if (normalizedPageId) {
      console.log("[Smart Campaign] Usando page_id para creative:", normalizedPageId);
      await assertPageIdIsUsable(normalizedPageId);
      const objectStorySpec = {
        page_id: normalizedPageId,
        link_data: {
          message: copy.body,
          link: defaultLink,
          name: copy.headline,
          description: copy.linkDescription || "",
          call_to_action: { type: copy.cta || "LEARN_MORE" },
        },
      };

      try {
        adCreativeResult = await metaPost<{ id: string }>(
          `/${accountId}/adcreatives`,
          {
            name: `${strategy.campaignName} - Creative`,
            object_story_spec: JSON.stringify(objectStorySpec),
          }
        );
      } catch (error) {
        if (
          error instanceof MetaApiError &&
          error.code === 100 &&
          error.subcode === 1443120
        ) {
          throw new MetaApiError(
            "Meta API: META_PAGE_ID no es válido para crear anuncios. Configura un Page ID de Facebook válido y con permisos en esta cuenta publicitaria.",
            {
              code: error.code,
              subcode: error.subcode,
              userMessage:
                "META_PAGE_ID no es válido para esta cuenta. Usa una página de Facebook válida vinculada al Business Manager y autorizada para publicar anuncios.",
            }
          );
        } else {
          throw error;
        }
      }
    } else {
      throw new MetaApiError(
        "Meta API: No se encontró una página válida para el anuncio. Configura META_PAGE_ID con un ID numérico de página autorizado.",
        {
          userMessage:
            "No hay página de Facebook válida para crear el anuncio. Configura META_PAGE_ID y verifica permisos de la app/token (ads_management, pages_show_list).",
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
      ok: true,
      data: {
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        adId: adResult.id,
        status: "PAUSED",
      },
    };
  } catch (error) {
    const msg =
      error instanceof MetaApiError
        ? (error.userMessage || error.message)
        : error instanceof Error
          ? error.message
          : "Error desconocido al publicar en Meta";
    console.error("[Smart Campaign] publishCampaign failed:", error);
    return { ok: false, error: msg };
  }
}
